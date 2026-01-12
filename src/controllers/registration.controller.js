import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  sendRegistrationConfirmation,
  sendTeamInviteEmail,
} from "../services/email.service.js";
// Note: You will need to create a sendTeamInviteEmail function in email.service.js

// Helper: Check if User is already part of ANY team for this event
const checkDuplicateRegistration = async (userId, eventId) => {
  const existing = await Registration.findOne({
    event: eventId,
    status: "active",
    $or: [
      { registeredBy: userId }, // Is Leader?
      { teamMembers: { $elemMatch: { user: userId, status: "accepted" } } }, // Is Active Member?
    ],
  });
  if (existing) {
    throw new ApiError(400, "This user is already registered for this event. A user cannot be in multiple teams for the same event.");
  }
};

// ==========================================
// 1. REGISTER (Solo or Team Leader)
// ==========================================
export const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId, teamName } = req.body;
  let { submissionData } = req.body; // Form data
  const user = req.user;

  // 1. Parse Data
  if (typeof submissionData === "string") {
    try {
      submissionData = JSON.parse(submissionData);
    } catch (e) {
      submissionData = {};
    }
  }

  // 2. Validate Event
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");
  if (!event.isRegistrationOpen)
    throw new ApiError(400, "Registration is closed.");

  // 3. Payment Check (Mandatory)
  if (user.paymentStatus !== "verified") {
    throw new ApiError(403, "Payment not verified. You cannot register.");
  }

  // 4. Duplicate Check
  await checkDuplicateRegistration(user._id, eventId);

  // 5. Check Capacity
  const currentCount = await Registration.countDocuments({
    event: eventId,
    status: "active",
  });
  if (event.maxRegistrations > 0 && currentCount >= event.maxRegistrations) {
    throw new ApiError(400, "Event has reached maximum capacity.");
  }

  // 6. Create Registration
  if (event.participationType === "group") {
    // if (!teamName) throw new ApiError(400, "Team Name is required.");

    // Create Team Shell
    const newReg = await Registration.create({
      registeredBy: user._id,
      event: eventId,
      teamName: submissionData.teamName || teamName || `Team_${user.jnanagniId}`,
      submissionData,
      teamMembers: [], // Starts empty
    });

    // Send Confirmation
    try {
      await sendRegistrationConfirmation(user, event.name);
    } catch (e) {}

    return res.status(201).json(newReg);
  } else {
    // Solo Logic
    const newReg = await Registration.create({
      registeredBy: user._id,
      event: eventId,
      submissionData,
    });
    try {
      await sendRegistrationConfirmation(user, event.name);
    } catch (e) {}

    return res.status(201).json(newReg);
  }
});

// ==========================================
// 2. INVITE MEMBER (Leader Only)
// ==========================================
export const inviteMember = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;
  const { email, jnanagniId } = req.body; // Can invite by either
  const leader = req.user;

  // 1. Find Registration & Verify Authority
  const registration = await Registration.findOne({
    _id: registrationId,
    registeredBy: leader._id,
  });
  if (!registration) throw new ApiError(403, "Team not found or unauthorized.");

  const event = await Event.findById(registration.event);

  // 2. Check Team Size Limit
  const currentSize =
    1 + registration.teamMembers.filter((m) => m.status !== "rejected").length; // Leader + Pending/Accepted
  if (currentSize >= event.maxTeamSize) {
    throw new ApiError(400, `Team limit reached (Max: ${event.maxTeamSize})`);
  }

  // 3. Find Target User
  const query = jnanagniId ? { jnanagniId } : { email };
  const invitee = await User.findOne(query);
  if (!invitee) throw new ApiError(404, "User to invite not found.");

  // 4. Constraints on Invitee
  if (invitee._id.toString() === leader._id.toString())
    throw new ApiError(400, "You cannot invite yourself to a team.");
  if (invitee.paymentStatus !== "verified")
    throw new ApiError(400, "Cannot invite this user - their payment has not been verified yet.");

  // Check if already in this team
  const inTeam = registration.teamMembers.find(
    (m) => m.email === invitee.email
  );
  if (inTeam && inTeam.status === "accepted")
    throw new ApiError(400, "This user is already a member of your team.");
  if (inTeam && inTeam.status === "pending")
    throw new ApiError(400, "An invitation has already been sent to this user for your team.");

  // Check if in ANOTHER team for the same event
  await checkDuplicateRegistration(invitee._id, event._id);

  // 5. Add to Array (Pending)
  registration.teamMembers.push({
    user: invitee._id, // We bind the ID immediately since we found them
    email: invitee.email,
    status: "pending",
  });
  await registration.save();

  try {
    await sendTeamInviteEmail(
      invitee.email,
      leader.name,
      registration.teamName,
      event.name
    );
  } catch (error) {
    console.error("Failed to send invite email:", error);
    // We don't throw error here to avoid failing the whole request
    // just because email service is down, as the invite is saved in DB.
  }

  res
    .status(200)
    .json({ message: "Invitation sent successfully", registration });
});

// ==========================================
// 3. RESPOND TO INVITE (Member)
// ==========================================
export const respondToInvite = asyncHandler(async (req, res) => {
  const registrationId = await req.params.registrationId;
  let { status, submissionData } = req.body; // submissionData for memberFields
  const user = req.user;

  // Parse submission data if it's a string (from frontend JSON.stringify)
  if (typeof submissionData === "string") {
    try {
      submissionData = JSON.parse(submissionData);
    } catch (e) {
      submissionData = {};
    }
  }

  if (!['accepted', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  if (!submissionData && status === 'accepted') {
    throw new ApiError(400, 'Submission data is required');
  }

  const registration = await Registration.findById(registrationId).populate('event');

  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  // Find the invite within the array
  const memberIndex = registration.teamMembers.findIndex(
    (m) => m.user?.toString() === user._id.toString() || m.email === user.email
  );
  
  // verify if the team limit is not exceeded on acceptance
  if (status === 'accepted') {
    const event = await Event.findById(registration.event);
    const currentSize =
      1 + registration.teamMembers.filter((m) => m.status === "accepted").length; // Leader + Accepted

      //  Check Team Size Limit
    if (currentSize >= event.maxTeamSize) {
      //  if team is already full
      throw new ApiError(400, `Team limit reached (Max: ${event.maxTeamSize})`);
    }
  }

  if (memberIndex === -1) {
    throw new ApiError(403, 'You were not invited to this team');
  }

  // Payment check
  if (user.paymentStatus !== 'verified') {
    throw new ApiError(403, 'Payment not verified');
  }

  // Double check duplicate registration before accepting
  if (status === 'accepted') {
    await checkDuplicateRegistration(user._id, registration.event._id);
  }

  // Update Status
  registration.teamMembers[memberIndex].status = status;
  registration.teamMembers[memberIndex].user = user._id;

  // STORE MEMBER SUBMISSION DATA (for memberFields)
  if (status === 'accepted' && submissionData) {
    registration.teamMembers[memberIndex].submissionData = submissionData;
  }

  await registration.save();

  res.status(200).json(
    new ApiResponse(200, registration, 'Invitation status updated')
  );
});


// ==========================================
// 4. REMOVE MEMBER (Leader Only)
// ==========================================
export const removeMember = asyncHandler(async (req, res) => {
  const { registrationId, memberId } = req.params; // memberId is the User ID to remove
  const leader = req.user;

  const registration = await Registration.findOne({
    _id: registrationId,
    registeredBy: leader._id,
  });
  if (!registration) throw new ApiError(403, "Unauthorized.");

  // Filter out the member
  registration.teamMembers = registration.teamMembers.filter(
    (m) => m.user.toString() !== memberId
  );

  await registration.save();
  res.status(200).json({ message: "Member removed", registration });
});

// ==========================================
// 5. DELETE TEAM/REGISTRATION (Leader Only)
// ==========================================
export const deleteRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  // Allow Leader OR Admin to delete
  const registration = await Registration.findOne({ _id: id });
  if (!registration) throw new ApiError(404, "Registration not found");

  const isLeader = registration.registeredBy.toString() === user._id.toString();
  const isAdmin = user.specialRoles.includes("admin");

  if (!isLeader && !isAdmin)
    throw new ApiError(403, "Only the Team Leader can dissolve the team.");

  await Registration.findByIdAndDelete(id);
  res.status(200).json({ message: "Registration cancelled successfully." });
});

// ==========================================
// 6. GET MY PENDING INVITES
// ==========================================
export const getMyInvites = asyncHandler(async (req, res) => {
  const user = req.user;

  try {
    const invites = await Registration.find({
      teamMembers: {
        $elemMatch: {
          $or: [{ user: user._id }, { email: user.email }],
          status: "pending",
        },
      },
    })
      .populate("registeredBy", "name email")
      .populate("event", "name date venue");

    res.status(200).json(invites);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invites", error });
  }
});

export const getRegistrationsByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Higher default limit for lists
    const skip = (page - 1) * limit;

    const registrations = await Registration.find({ event: eventId })
      // .populate("registeredBy",  "name email jnanagniId contactNo")
      .populate({
        path: "registeredBy",
        select: "name email jnanagniId contactNo",
        model: User,
      })
      .populate("event", "title date")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalDocs = await Registration.countDocuments({ event: eventId });

    res.status(200).json({
      registrations,
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching registrations", error });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const registrationId = req.params.id;
    const { status } = req.body;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (!["active", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // if cancelled, delete the registration
    if (status === "cancelled") {
      await Registration.findByIdAndDelete(registrationId);
      return res
        .status(200)
        .json({ message: "Registration cancelled successfully" });
    }

    // Otherwise, update status
    registration.status = status;
    await registration.save();

    res.status(200).json(registration);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating registration status", error });
  }
};

export const getRegistrationsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Find registrations where user is either the leader OR an accepted team member
    const registrations = await Registration.find({
      $or: [
        { registeredBy: userId },
        { 
          teamMembers: { 
            $elemMatch: { 
              user: userId, 
              status: "accepted" 
            } 
          }
        }
      ],
      status: "active"
    })
      .populate("registeredBy", "name email")
      .populate("event", "title date venue maxTeamSize")
      .populate("teamMembers.user", "name email jnanagniId");
    
    res.status(200).json(registrations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user registrations", error });
  }
};

export const getRegistrationById = async (req, res) => {
  try {
    const registrationId = req.params.id;
    const registration = await Registration.findById(registrationId)
      .populate("user", "name email")
      .populate("event", "title date venue");
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json(registration);
  } catch (error) {
    res.status(500).json({ message: "Error fetching registration", error });
  }
};

// update registration submission data
export const updateRegistrationSubmissionData = async (req, res) => {
  try {
    const registrationId = req.params.id;
    const { submissionData } = req.body;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.submissionData = submissionData;
    await registration.save();

    res.status(200).json(registration);
  } catch (error) {
    res.status(500).json({ message: "Error updating submission data", error });
  }
};


// get all registrations (admin)
export const getAllRegistrations = async (req, res) => {
  try {

    const registrations = await Registration.find()
      .populate("registeredBy", "name email jnanagniId contactNo")
      .populate("event", "title date")
      .sort({ createdAt: -1 })

    res.status(200).json({message: "All registrations fetched successfully", registrations});
  } catch (error) {
    res.status(500).json({ message: "Error fetching registrations", error });
  }
}