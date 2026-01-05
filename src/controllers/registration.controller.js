import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
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
  if (existing)
    throw new ApiError(400, "User is already registered for this event.");
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
    if (!teamName) throw new ApiError(400, "Team Name is required.");

    // Create Team Shell
    const newReg = await Registration.create({
      registeredBy: user._id,
      event: eventId,
      teamName,
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
    throw new ApiError(400, "Cannot invite yourself.");
  if (invitee.paymentStatus !== "verified")
    throw new ApiError(400, "Invitee has not verified their payment yet.");

  // Check if already in this team
  const inTeam = registration.teamMembers.find(
    (m) => m.email === invitee.email
  );
  if (inTeam && inTeam.status === "accepted")
    throw new ApiError(400, "User already in team.");
  if (inTeam && inTeam.status === "pending")
    throw new ApiError(400, "Invite already sent.");

  // Check if in ANOTHER team
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
  const { registrationId } = req.params;
  const { status, submissionData } = req.body; // 'accepted' or 'rejected'
  const user = req.user;

  if (!["accepted", "rejected"].includes(status))
    throw new ApiError(400, "Invalid status.");

  const registration = await Registration.findById(registrationId).populate(
    "event"
  );
  if (!registration) throw new ApiError(404, "Registration not found.");

  // Check expiry or validity logic here if needed

  // Find the invite within the array
  const memberIndex = registration.teamMembers.findIndex(
    (m) =>
      (m.user && m.user.toString() === user._id.toString()) ||
      m.email === user.email
  );

  if (memberIndex === -1)
    throw new ApiError(403, "You were not invited to this team.");

  // Payment Check again (Safety)
  if (user.paymentStatus !== "verified")
    throw new ApiError(403, "Payment not verified.");

  // Update Status
  registration.teamMembers[memberIndex].status = status;
  registration.teamMembers[memberIndex].user = user._id; // Ensure ID is linked

  if (status === "accepted") {
    // Double check duplicate registration just before saving
    await checkDuplicateRegistration(user._id, registration.event._id);

    // Save member specific form data
    if (submissionData) {
      registration.teamMembers[memberIndex].submissionData = submissionData;
    }
  }

  await registration.save();

  res.status(200).json({ message: `Invitation ${status}`, registration });
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

  // Find registrations where this user is in teamMembers with status 'pending'
  const invites = await Registration.find({
    teamMembers: {
      $elemMatch: {
        $or: [{ user: user._id }, { email: user.email }],
        status: "pending",
      },
    },
  })
    .populate("registeredBy", "name")
    .populate("event", "name date");

  res.status(200).json(invites);
});

export const getRegistrationsByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Higher default limit for lists
    const skip = (page - 1) * limit;

    const registrations = await Registration.find({ event: eventId })
      .populate("user", "name email jnanagniId contactNo")
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
    const registrations = await Registration.find({ user: userId }).populate(
      "event",
      "title date venue"
    );
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
