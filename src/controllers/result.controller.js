import { Result } from "../models/result.model.js";
import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// --- 1. PUBLISH / UPDATE RESULTS (Draft or Live) ---
export const publishResults = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  // Default published to false if not sent
  const { winners, published = false, round = "Final" } = req.body; 
  const userId = req.user._id;

  if (!winners || !Array.isArray(winners) || winners.length === 0) {
    throw new ApiError(400, "Winners list cannot be empty");
  }

  // Validate Event
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  // Validate Registrations
  const registrationIds = winners.map(w => w.registrationId);
  const validRegistrations = await Registration.find({
    _id: { $in: registrationIds },
    event: eventId 
  });

  if (validRegistrations.length !== registrationIds.length) {
    throw new ApiError(400, "Invalid registration IDs detected for this event.");
  }

  const formattedWinners = winners.map(w => ({
    rank: w.rank,
    registration: w.registrationId,
    score: w.score || "",
    qualified: w.qualified !== false // Default true unless explicitly false
  }));

  // Update logic: Find by Event AND Round
  let result = await Result.findOne({ event: eventId, round: round });

  if (result) {
    result.winners = formattedWinners;
    result.published = published;
    result.publishedBy = userId;
    await result.save();
  } else {
    result = await Result.create({
      event: eventId,
      round: round, // Save the round
      winners: formattedWinners,
      published: published,
      publishedBy: userId
    });
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Results saved successfully")
  );
});

// --- 2. TOGGLE PUBLISH STATUS (Quick Switch) ---
export const toggleResultVisibility = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { publish } = req.body; // Expecting { "publish": true/false }

    if (publish === undefined) throw new ApiError(400, "Publish status required");

    const result = await Result.findOne({ event: eventId });
    if (!result) throw new ApiError(404, "No results found for this event to update");

    result.published = publish;
    await result.save();

    return res.status(200).json(
        new ApiResponse(200, result, `Results are now ${publish ? 'LIVE' : 'HIDDEN'}`)
    );
});

// --- 3. PUBLIC VIEW (Strictly Published Only) ---
export const getPublicResults = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  // QUERY FILTER: Must match event AND be published
  const result = await Result.findOne({ event: eventId, published: true })
    .populate("event", "name date category")
    .populate({
      path: "winners.registration",
      select: "teamName submissionData registeredBy teamMembers",
      populate: [
        { path: "registeredBy", select: "name college" }, // Limit public info
        { path: "teamMembers.user", select: "name" }      // Limit public info
      ]
    })
    .lean();

  if (!result) {
    // Return empty/null if draft or not found. 
    // We do NOT tell the public "it exists but is hidden" for security/privacy.
    return res.status(200).json(new ApiResponse(200, null, "Results not yet announced"));
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Results fetched successfully")
  );
});

// --- 4. ADMIN VIEW (See Drafts & Live) ---
export const getAdminResults = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  // NO FILTER on 'published'
  const result = await Result.findOne({ event: eventId })
    .populate("event", "name")
    .populate({
      path: "winners.registration",
      select: "teamName submissionData registeredBy teamMembers",
      populate: [
        { path: "registeredBy", select: "name email jnanagniId contactNo college" }, // Full info for admin
        { path: "teamMembers.user", select: "name email jnanagniId" }
      ]
    })
    .lean();

  if (!result) {
    return res.status(404).json(new ApiResponse(404, null, "No results created yet"));
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Admin results fetched")
  );
});

// --- DELETE (Unchanged) ---
export const deleteResults = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const deleted = await Result.findOneAndDelete({ event: eventId });
  if (!deleted) throw new ApiError(404, "Results not found");
  return res.status(200).json(new ApiResponse(200, null, "Results deleted"));
});