import { Result } from "../models/result.model.js";
import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Certificate } from "../models/certificate.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// ==========================================
// 1. CREATE ROUND FOR AN EVENT
// ==========================================
export const createRound = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Round name is required");
  }

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  // Find next sequence number
  const nextSequence = event.rounds.length + 1;

  // Add round to event
  const roundId = new mongoose.Types.ObjectId();
  event.rounds.push({
    _id: roundId,
    name,
    sequenceNumber: nextSequence,
    isActive: false,
    resultsPublished: false,
  });

  await event.save();

  return res.status(201).json(
    new ApiResponse(201, event.rounds[event.rounds.length - 1], "Round created successfully")
  );
});

// ==========================================
// 2. ACTIVATE A ROUND
// ==========================================
export const activateRound = asyncHandler(async (req, res) => {
  const { eventId, roundId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  // Find the round
  const roundIndex = event.rounds.findIndex(r => r._id.toString() === roundId);
  if (roundIndex === -1) {
    throw new ApiError(404, "Round not found in this event");
  }

  // Deactivate all rounds
  event.rounds.forEach(r => r.isActive = false);

  // Activate the selected round
  event.rounds[roundIndex].isActive = true;
  event.currentRoundIndex = roundIndex;

  await event.save();

  return res.status(200).json(
    new ApiResponse(200, event.rounds[roundIndex], "Round activated successfully")
  );
});

// ==========================================
// 3. GET ALL ROUNDS FOR AN EVENT
// ==========================================
export const getRounds = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).select("rounds currentRoundIndex");
  if (!event) throw new ApiError(404, "Event not found");

  return res.status(200).json(
    new ApiResponse(200, event.rounds, "Rounds fetched successfully")
  );
});

// ==========================================
// 4. PUBLISH RESULTS & SELECT QUALIFIERS
// ==========================================
export const publishResults = asyncHandler(async (req, res) => {
  const { eventId, roundId } = req.params;
  const { results, qualifiedRegistrations } = req.body;
  const userId = req.user._id;

  if (!results || !Array.isArray(results) || results.length === 0) {
    throw new ApiError(400, "Results list cannot be empty");
  }

  // Validate Event & Round
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  const round = event.rounds.find(r => r._id.toString() === roundId);
  if (!round) throw new ApiError(404, "Round not found in this event");

  if (!round.isActive) {
    throw new ApiError(400, "Can only publish results for the active round");
  }

  // Validate Registrations
  const registrationIds = results.map(r => r.registrationId);
  const validRegistrations = await Registration.find({
    _id: { $in: registrationIds },
    event: eventId,
    status: "active"
  });

  if (validRegistrations.length !== registrationIds.length) {
    throw new ApiError(400, "Invalid or inactive registrations detected");
  }

  // Format results
  const formattedResults = results.map((r, idx) => ({
    rank: r.rank || idx + 1,
    registration: r.registrationId,
    score: r.score || "",
    won: r.rank && r.rank <= 3 && round.sequenceNumber === event.rounds.length // Top 3 in final round
  }));

  // Check if this is the final round (last round)
  const isFinalRound = round.sequenceNumber === event.rounds.length;

  // For final round, auto-select top 3 as winners
  let qualified = qualifiedRegistrations || [];
  if (isFinalRound) {
    // Top 3 are winners
    qualified = formattedResults
      .filter(r => r.rank && r.rank <= 3)
      .map(r => r.registration);
  } else {
    // For other rounds, admin must specify who qualifies
    if (!qualifiedRegistrations || qualifiedRegistrations.length === 0) {
      throw new ApiError(400, "Must specify which registrations qualify for next round");
    }
    qualified = qualifiedRegistrations;
  }

  // Find or create result document
  let resultDoc = await Result.findOne({ event: eventId, roundId });

  if (resultDoc) {
    resultDoc.results = formattedResults;
    resultDoc.qualifiedForNextRound = qualified;
    resultDoc.published = true;
    resultDoc.publishedBy = userId;
    resultDoc.publishedAt = new Date();
    await resultDoc.save();
  } else {
    resultDoc = await Result.create({
      event: eventId,
      roundId,
      roundName: round.name,
      roundSequenceNumber: round.sequenceNumber,
      results: formattedResults,
      qualifiedForNextRound: qualified,
      published: true,
      publishedBy: userId,
      publishedAt: new Date()
    });
  }

  // Update event round status
  round.resultsPublished = true;
  await event.save();

  // Update certificates for winners (if final round)
  if (isFinalRound) {
    const topThree = formattedResults.slice(0, 3);
    for (let i = 0; i < topThree.length; i++) {
      const result = topThree[i];
      
      // Update certificate for leader
      await Certificate.findOneAndUpdate(
        { registration: result.registration },
        {
          isWinner: true,
          type: i === 0 ? "excellence" : "completion",
          winnerRank: i + 1,
          roundReached: round.name,
          isGenerated: true
        },
        { upsert: true }
      );
    }
  }

  return res.status(200).json(
    new ApiResponse(200, resultDoc, "Results published successfully")
  );
});

// ==========================================
// 5. GET RESULTS FOR A ROUND (Admin View)
// ==========================================
export const getResults = asyncHandler(async (req, res) => {
  const { eventId, roundId } = req.params;

  const result = await Result.findOne({ event: eventId, roundId })
    .populate("event", "name")
    .populate({
      path: "results.registration",
      select: "teamName submissionData registeredBy teamMembers",
      populate: [
        { path: "registeredBy", select: "name email jnanagniId college" },
        { path: "teamMembers.user", select: "name email jnanagniId" }
      ]
    })
    .populate({
      path: "qualifiedForNextRound",
      select: "teamName registeredBy"
    })
    .lean();

  if (!result) {
    return res.status(200).json(new ApiResponse(200, null, "No results created yet"));
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Results fetched successfully")
  );
});

// ==========================================
// 6. GET PUBLIC RESULTS (Published only)
// ==========================================
export const getPublicResults = asyncHandler(async (req, res) => {
  const { eventId, roundId } = req.params;

  const result = await Result.findOne({ event: eventId, roundId, published: true })
    .populate("event", "name date category")
    .populate({
      path: "results.registration",
      select: "teamName registeredBy teamMembers",
      populate: [
        { path: "registeredBy", select: "name college" },
        { path: "teamMembers.user", select: "name" }
      ]
    })
    .lean();

  if (!result) {
    return res.status(200).json(new ApiResponse(200, null, "Results not yet announced"));
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Results fetched successfully")
  );
});

// ==========================================
// 7. GET QUALIFIED TEAMS FOR NEXT ROUND
// ==========================================
export const getQualifiedTeams = asyncHandler(async (req, res) => {
  const { eventId, roundId } = req.params;

  const result = await Result.findOne({ event: eventId, roundId })
    .populate({
      path: "qualifiedForNextRound",
      select: "teamName registeredBy"
    })
    .lean();

  if (!result) {
    return res.status(200).json(new ApiResponse(200, [], "No qualified teams yet"));
  }

  return res.status(200).json(
    new ApiResponse(200, result.qualifiedForNextRound, "Qualified teams fetched")
  );
});

// ==========================================
// 8. DELETE ROUND
// ==========================================
export const deleteRound = asyncHandler(async (req, res) => {
  const { eventId, roundId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  const roundIndex = event.rounds.findIndex(r => r._id.toString() === roundId);
  if (roundIndex === -1) {
    throw new ApiError(404, "Round not found");
  }

  // Don't delete if results published
  const result = await Result.findOne({ event: eventId, roundId });
  if (result && result.published) {
    throw new ApiError(400, "Cannot delete a round with published results");
  }

  // Remove round and update sequence numbers
  event.rounds.splice(roundIndex, 1);
  event.rounds.forEach((r, idx) => {
    r.sequenceNumber = idx + 1;
  });

  await event.save();

  // Delete result document if exists
  await Result.deleteOne({ event: eventId, roundId });

  return res.status(200).json(
    new ApiResponse(200, null, "Round deleted successfully")
  );
});

// ==========================================
// 9. DELETE RESULTS (Unpublish)
// ==========================================
export const deleteResults = asyncHandler(async (req, res) => {
  const { eventId, roundId } = req.params;

  const result = await Result.findOneAndDelete({ event: eventId, roundId });
  if (!result) throw new ApiError(404, "Results not found");

  // Update event round status
  const event = await Event.findById(eventId);
  const round = event.rounds.find(r => r._id.toString() === roundId);
  if (round) {
    round.resultsPublished = false;
  }
  await event.save();

  return res.status(200).json(new ApiResponse(200, null, "Results deleted"));
});