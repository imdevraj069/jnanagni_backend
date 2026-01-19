import { Attendance } from "../models/attendance.model.js";
import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ==========================================
// MARK PRESENT (With Admin Override Logic)
// ==========================================
export const markAttendance = asyncHandler(async (req, res) => {
    // 1. Accept 'force' parameter (Boolean)
    const { jnanagniId, eventId, round = "check-in", force = false } = req.body;
    const scannerId = req.user._id;

    if (!jnanagniId || !eventId) throw new ApiError(400, "IDs required");

    // 2. Fetch Context
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    const user = await User.findOne({ jnanagniId });
    if (!user) throw new ApiError(404, "User not found");

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
    // 🛑 VALIDATION: ROSTER CHECK (Blocking Logic)
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
            
            // 🛑 BLOCKING CONDITION
            // If the team is incomplete AND the admin hasn't explicitly said "force: true"
            if (!force) {
                // We return a 409 (Conflict) to signal the App to show a Confirmation Dialog
                return res.status(409).json({
                    success: false,
                    statusCode: 409,
                    message: registrationErrorMsg,
                    data: {
                        requiresConfirmation: true, // App uses this flag to show "Allow Anyway?" dialog
                        teamName: registration.teamName,
                        currentSize: totalRegisteredCount,
                        minRequired: event.minTeamSize
                    }
                });
            }
        }
    }

    // 3. Create/Check Attendance Record
    // (If we reached here, either the team is valid OR force=true)
    
    let attendance = await Attendance.findOne({ event: eventId, user: user._id, round });
    
    if (!attendance) {
        attendance = await Attendance.create({
            event: eventId,
            registration: registration._id,
            user: user._id,
            round,
            scannedBy: scannerId
        });
    } else {
        return res.status(200).json(
             new ApiResponse(200, {
                status: "already_checked_in",
                user: user.name,
                checkInTime: attendance.createdAt
             }, "User already checked in.")
        );
    }

    // 4. Calculate Stats for Response
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
             teamStatusMsg += " [FORCE ALLOWED]"; // Indicate this was an override
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
            isRegistrationValid, // Will be false if forced
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