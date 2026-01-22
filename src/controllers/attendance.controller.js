import { Attendance } from "../models/attendance.model.js";
import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import User from "../models/user.model.js";
import { Result } from "../models/result.model.js";
import { Certificate } from "../models/certificate.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// ==========================================
// MARK ATTENDANCE (With Round Qualification Gating)
// ==========================================
export const markAttendance = asyncHandler(async (req, res) => {
    const { jnanagniId, eventId, roundId, force = false } = req.body;
    const scannerId = req.user._id;

    if (!jnanagniId || !eventId || !roundId) {
        throw new ApiError(400, "jnanagniId, eventId, and roundId are required");
    }

    // Fetch Event
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    // Find the round in event.rounds
    const round = event.rounds.find(r => r._id.toString() === roundId);
    if (!round) throw new ApiError(404, "Round not found in this event");

    // Fetch User
    const user = await User.findOne({ jnanagniId });
    if (!user) throw new ApiError(404, "User not found");

    // Find User's Registration (Solo or Team)
    const registration = await Registration.findOne({
        event: eventId,
        status: "active",
        $or: [
            { registeredBy: user._id }, 
            { teamMembers: { $elemMatch: { user: user._id, status: "accepted" } } }
        ]
    });

    if (!registration) {
        throw new ApiError(403, "User is not registered for this event");
    }

    // =========================================================
    // 🛡️ GATE 1: QUALIFICATION CHECK FROM PREVIOUS ROUND
    // =========================================================
    if (round.sequenceNumber > 1 && !force) {
        // Get previous round
        const previousRound = event.rounds.find(r => r.sequenceNumber === round.sequenceNumber - 1);
        
        if (previousRound) {
            // Get results from previous round
            const prevResult = await Result.findOne({
                event: eventId,
                roundId: previousRound._id,
                published: true
            });

            if (!prevResult) {
                throw new ApiError(400, 
                    `Results for '${previousRound.name}' must be published first`
                );
            }

            // Check if this registration is in qualified list
            const isQualified = prevResult.qualifiedForNextRound.some(regId =>
                regId.toString() === registration._id.toString()
            );

            if (!isQualified) {
                throw new ApiError(403, 
                    `Your team did not qualify from the ${previousRound.name} round`
                );
            }
        }
    }

    // =========================================================
    // 🛡️ GATE 2: ROSTER SIZE CHECK (Group Events)
    // =========================================================
    let isRegistrationValid = true;
    let registrationErrorMsg = "";

    if (event.participationType === "group") {
        const acceptedMembersCount = registration.teamMembers
            .filter(m => m.status === 'accepted').length;
        const totalRegisteredCount = 1 + acceptedMembersCount;

        if (totalRegisteredCount < event.minTeamSize) {
            isRegistrationValid = false;
            registrationErrorMsg = `Team only has ${totalRegisteredCount} members (Min: ${event.minTeamSize})`;
            
            if (!force) {
                return res.status(409).json({
                    success: false,
                    statusCode: 409,
                    message: registrationErrorMsg,
                    data: {
                        requiresConfirmation: true,
                        teamName: registration.teamName,
                        currentSize: totalRegisteredCount,
                        minRequired: event.minTeamSize,
                        warning: "Team size below minimum. Allow anyway?"
                    }
                });
            }
        }
    }

    // =========================================================
    // ✅ CREATE ATTENDANCE RECORD
    // =========================================================
    let attendance = await Attendance.findOne({ 
        event: eventId, 
        roundId: roundId,
        user: user._id 
    });

    if (attendance) {
        return res.status(200).json(
            new ApiResponse(200, {
                status: "already_checked_in",
                user: user.name,
                checkInTime: attendance.createdAt
            }, "User already checked in for this round")
        );
    }

    // Create attendance record
    attendance = await Attendance.create({
        event: eventId,
        roundId: roundId,
        roundName: round.name,
        registration: registration._id,
        user: user._id,
        scannedBy: scannerId
    });

    // =========================================================
    // 📜 UPDATE CERTIFICATE - Track highest round reached
    // =========================================================
    try {
        let certificate = await Certificate.findOne({ registration: registration._id });

        if (!certificate) {
            // Create new certificate
            const uniqueId = `JGN26-CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            certificate = await Certificate.create({
                user: user._id,
                event: eventId,
                registration: registration._id,
                certificateId: uniqueId,
                type: "participation",
                roundReached: round.name,
                issuedAt: new Date()
            });
        } else {
            // Update round reached if this round is higher
            const existingIndex = event.rounds.findIndex(r => r.name === certificate.roundReached);
            if (round.sequenceNumber > existingIndex + 1) {
                certificate.roundReached = round.name;
            }
            await certificate.save();
        }

        console.log(`[Certificate] Updated for ${user.jnanagniId} @ ${round.name}`);
    } catch (error) {
        console.error("[Certificate] Update failed (Non-blocking):", error);
        // Non-blocking - continue even if certificate fails
    }

    // =========================================================
    // 📊 RESPONSE: TEAM STATUS
    // =========================================================
    let teamStatusMsg = "Verified";
    let isPhysicalTeamComplete = true;

    if (event.participationType === "group") {
        const currentPresentCount = await Attendance.countDocuments({
            registration: registration._id,
            event: eventId,
            roundId: roundId
        });

        isPhysicalTeamComplete = currentPresentCount >= event.minTeamSize;
        teamStatusMsg = `Present: ${currentPresentCount}/${event.minTeamSize}`;
        
        if (!isRegistrationValid) {
            teamStatusMsg += " [FORCE]";
        } else if (isPhysicalTeamComplete) {
            teamStatusMsg += " [COMPLETE]";
        } else {
            teamStatusMsg += " [INCOMPLETE]";
        }
    }

    res.status(200).json(
        new ApiResponse(200, {
            status: "success",
            user: user.name,
            teamName: registration.teamName || "Solo",
            roundName: round.name,
            isRegistrationValid,
            isPhysicalTeamComplete,
            teamStatus: teamStatusMsg,
            timestamp: new Date()
        }, "Attendance marked successfully")
    );
});

// ==========================================
// MARK ABSENT (Remove attendance)
// ==========================================
export const markAbsent = asyncHandler(async (req, res) => {
    const { jnanagniId, eventId, roundId } = req.body;

    if (!jnanagniId || !eventId || !roundId) {
        throw new ApiError(400, "jnanagniId, eventId, and roundId are required");
    }

    const user = await User.findOne({ jnanagniId });
    if (!user) throw new ApiError(404, "User not found");

    const deleted = await Attendance.findOneAndDelete({
        event: eventId,
        roundId: roundId,
        user: user._id
    });

    if (!deleted) {
        throw new ApiError(404, "No attendance record found");
    }

    res.status(200).json(
        new ApiResponse(200, null, `Attendance removed for ${user.name}`)
    );
});

// ==========================================
// GET ATTENDANCE STATS FOR A ROUND
// ==========================================
export const getEventAttendanceStats = asyncHandler(async (req, res) => {
    const { eventId, roundId } = req.params;

    const stats = await Attendance.aggregate([
        { 
            $match: { 
                event: new mongoose.Types.ObjectId(eventId),
                roundId: new mongoose.Types.ObjectId(roundId)
            }
        },
        { 
            $group: { 
                _id: "$registration",
                presentMembers: { $push: "$user" },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "registrations",
                localField: "_id",
                foreignField: "_id",
                as: "regDetails"
            }
        },
        { $unwind: "$regDetails" },
        {
            $project: {
                _id: 0,
                registrationId: "$_id",
                teamName: "$regDetails.teamName",
                presentCount: "$count"
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, stats, "Attendance stats fetched")
    );
});

// ==========================================
// GET DETAILED ATTENDANCE LIST (Event & Round Wise)
// ==========================================
export const getAttendanceListByEventAndRound = asyncHandler(async (req, res) => {
    const { eventId, roundId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId).select("name rounds");
    if (!event) throw new ApiError(404, "Event not found");

    // Verify round exists
    const round = event.rounds.find(r => r._id.toString() === roundId);
    if (!round) throw new ApiError(404, "Round not found");

    // Get all attendance records with full details
    const attendanceList = await Attendance.find({
        event: eventId,
        roundId: roundId
    })
    .populate({
        path: "registration",
        select: "teamName registeredBy teamMembers"
    })
    .populate({
        path: "user",
        select: "name email jnanagniId college"
    })
    .populate({
        path: "scannedBy",
        select: "name email"
    })
    .sort({ createdAt: 1 })
    .lean();

    // Group by registration (team) for better readability
    const groupedByTeam = {};
    
    attendanceList.forEach(record => {
        const regId = record.registration._id.toString();
        
        if (!groupedByTeam[regId]) {
            groupedByTeam[regId] = {
                registrationId: regId,
                teamName: record.registration.teamName || "Solo",
                registeredBy: record.registration.registeredBy,
                presentMembers: [],
                presentCount: 0,
                checkInTime: record.createdAt
            };
        }
        
        groupedByTeam[regId].presentMembers.push({
            userId: record.user._id,
            name: record.user.name,
            email: record.user.email,
            jnanagniId: record.user.jnanagniId,
            college: record.user.college,
            scannedAt: record.createdAt,
            scannedBy: record.scannedBy ? {
                name: record.scannedBy.name,
                email: record.scannedBy.email
            } : null
        });
        
        groupedByTeam[regId].presentCount++;
    });

    const response = {
        event: {
            eventId: event._id,
            eventName: event.name
        },
        round: {
            roundId: round._id,
            roundName: round.name,
            sequenceNumber: round.sequenceNumber
        },
        summary: {
            totalPresent: attendanceList.length,
            totalTeamsPresent: Object.keys(groupedByTeam).length
        },
        attendanceList: Object.values(groupedByTeam).sort((a, b) => 
            new Date(a.checkInTime) - new Date(b.checkInTime)
        )
    };

    res.status(200).json(
        new ApiResponse(200, response, "Attendance list fetched successfully")
    );
});