import { Attendance } from "../models/attendance.model.js";
import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import User from "../models/user.model.js";
import { Result } from "../models/result.model.js"; // Needed for round validation
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateCertificateInternal } from "./certificate.controller.js"; // Import the helper

// Define the progression of rounds
const ROUND_ORDER = ["Check-In", "Preliminary", "Quarter-Final", "Semi-Final", "Final"];

// ==========================================
// MARK ATTENDANCE (With Round Gating & Cert Generation)
// ==========================================
export const markAttendance = asyncHandler(async (req, res) => {
    // 1. Accept inputs
    const { jnanagniId, eventId, force = false, round = "Check-In" } = req.body;
    const scannerId = req.user._id;

    if (!jnanagniId || !eventId) throw new ApiError(400, "IDs required");

    // 2. Fetch Context (User & Event)
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    const user = await User.findOne({ jnanagniId });
    if (!user) throw new ApiError(404, "User not found");

    // 3. Find User's Registration (Solo or Team)
    // We check if they are the Leader OR an Accepted Member
    const registration = await Registration.findOne({
        event: eventId,
        status: "active",
        $or: [
            { registeredBy: user._id }, 
            { teamMembers: { $elemMatch: { user: user._id, status: "accepted" } } }
        ]
    }).populate("registeredBy", "name jnanagniId");

    if (!registration) {
        throw new ApiError(403, "Access Denied: User is not registered for this event.");
    }

    // =========================================================
    // 🛡️ GATE 1: ROUND QUALIFICATION CHECK
    // Logic: If trying to enter a later round, check if they passed the previous one.
    // =========================================================
    if (round !== "Check-In" && !force) {
        const currentIndex = ROUND_ORDER.indexOf(round);
        
        if (currentIndex > 0) {
            const previousRoundName = ROUND_ORDER[currentIndex - 1];

            // If the previous round wasn't just "Check-In", we usually check the Results table.
            if (previousRoundName !== "Check-In") {
                const prevResult = await Result.findOne({ 
                    event: eventId, 
                    round: previousRoundName 
                });

                if (!prevResult) {
                    throw new ApiError(400, `Results for '${previousRoundName}' have not been published yet.`);
                }

                // Check if this Registration ID is in the winners list AND is qualified
                const isQualified = prevResult.winners.some(w => 
                    w.registration.toString() === registration._id.toString() && w.qualified
                );

                if (!isQualified) {
                    throw new ApiError(403, `⛔ Access Denied: Team did not qualify from ${previousRoundName}.`);
                }
            }
        }
    }

    // =========================================================
    // 🛡️ GATE 2: ROSTER SIZE CHECK (Group Events)
    // Logic: Warn if team is physically smaller than minimum required size.
    // =========================================================
    let isRegistrationValid = true;
    let registrationErrorMsg = "";

    if (event.participationType === "group") {
        // Count Leader (1) + Accepted Members
        const acceptedMembersCount = registration.teamMembers.filter(m => m.status === 'accepted').length;
        const totalRegisteredCount = 1 + acceptedMembersCount; 

        if (totalRegisteredCount < event.minTeamSize) {
            isRegistrationValid = false;
            registrationErrorMsg = `Team only has ${totalRegisteredCount} members (Min: ${event.minTeamSize}).`;
            
            // BLOCKING CONDITION (unless force=true)
            if (!force) {
                return res.status(409).json({
                    success: false,
                    statusCode: 409,
                    message: registrationErrorMsg,
                    data: {
                        requiresConfirmation: true, // Frontend shows "Allow Anyway?" dialog
                        teamName: registration.teamName,
                        currentSize: totalRegisteredCount,
                        minRequired: event.minTeamSize,
                        warning: "Team size below minimum requirement."
                    }
                });
            }
        }
    }

    // =========================================================
    // ✅ EXECUTE: CREATE ATTENDANCE RECORD
    // =========================================================
    
    // Check if already scanned for THIS round
    let attendance = await Attendance.findOne({ event: eventId, user: user._id, round });
    
    if (attendance) {
        return res.status(200).json(
             new ApiResponse(200, {
                status: "already_checked_in",
                user: user.name,
                checkInTime: attendance.createdAt
             }, "User already checked in for this round.")
        );
    }

    // Create Record
    attendance = await Attendance.create({
        event: eventId,
        registration: registration._id,
        user: user._id,
        round: round,
        scannedBy: scannerId
    });

    // =========================================================
    // 📜 ACTION: AUTO-GENERATE / UPDATE CERTIFICATE
    // =========================================================
    try {
        await generateCertificateInternal({
            userId: user._id,
            eventId: eventId,
            registrationId: registration._id,
            round: round
        });
        console.log(`[Certificate] Updated for ${user.jnanagniId} @ ${round}`);
    } catch (error) {
        console.error("[Certificate] Auto-generation failed (Non-blocking):", error);
        // We do NOT throw here. Attendance is successful even if cert fails.
    }

    // =========================================================
    // 📊 RESPONSE: CALCULATE LIVE STATS FOR UI
    // =========================================================
    let teamStatusMsg = "Verified";
    let isPhysicalTeamComplete = true; 

    if (event.participationType === "group") {
        const currentPresentCount = await Attendance.countDocuments({
            registration: registration._id,
            event: eventId,
            round: round
        });

        isPhysicalTeamComplete = currentPresentCount >= event.minTeamSize;
        teamStatusMsg = `Physical Presence: ${currentPresentCount}/${event.minTeamSize}`;
        
        if (!isRegistrationValid) {
             teamStatusMsg += " [FORCE ALLOWED]"; 
        } else if (isPhysicalTeamComplete) {
             teamStatusMsg += " [QUALIFIED]";
        } else {
             teamStatusMsg += " [WAITING]";
        }
    }

    res.status(200).json(
        new ApiResponse(200, {
            status: "success",
            user: user.name,
            teamName: registration.teamName || "Solo",
            round: round,
            isRegistrationValid, 
            isPhysicalTeamComplete,
            teamStatus: teamStatusMsg,
            timestamp: new Date()
        }, isRegistrationValid ? `Marked Present: ${user.name}` : `Forced Entry: ${user.name}`)
    );
});

// ==========================================
// MARK ABSENT (Undo Check-In)
// ==========================================
export const markAbsent = asyncHandler(async (req, res) => {
    const { jnanagniId, eventId, round = "check-in" } = req.body;

    const user = await User.findOne({ jnanagniId });
    if (!user) throw new ApiError(404, "User not found");

    const deleted = await Attendance.findOneAndDelete({
        event: eventId,
        user: user._id,
        round: round
    });

    if (!deleted) {
        throw new ApiError(404, "No attendance record found to delete.");
    }

    res.status(200).json(
        new ApiResponse(200, null, `Marked Absent (Record Deleted): ${user.name}`)
    );
});

// ==========================================
// GET LIVE EVENT STATS (For Admin Dashboard)
// ==========================================
export const getEventAttendanceStats = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { round = "check-in" } = req.query;

    const stats = await Attendance.aggregate([
        { $match: { event: new mongoose.Types.ObjectId(eventId), round: round } },
        { 
            $group: { 
                _id: "$registration", // Group by Team
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
                teamName: "$regDetails.teamName",
                presentCount: "$count",
                // You can add logic here to compare with minTeamSize if needed
            }
        }
    ]);

    res.status(200).json(new ApiResponse(200, stats, "Attendance stats fetched"));
});