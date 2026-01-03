import {Registration} from "../models/registration.model.js";
import { sendRegistrationConfirmation } from "../services/email.service.js"; // Import this
import { Event } from "../models/event.model.js"; // Ensure Event is imported


export const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        // Parse submissionData because multipart/form-data sends it as a string
        let { submissionData } = req.body;
        
        if (typeof submissionData === 'string') {
            try {
                submissionData = JSON.parse(submissionData);
            } catch (e) {
                submissionData = {}; 
            }
        } else {
            submissionData = submissionData || {};
        }

        const user = req.user;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (!event.isRegistrationOpen) {
            return res.status(400).json({ message: "Registration is closed for this event." });
        }

        let finalTeamMemberDbIds = []; // Stores ObjectIds of teammates

        if (event.participationType === 'solo') {
            // CHECK 1: Solo Payment Check
            if (user.paymentStatus !== 'verified') {
                return res.status(403).json({ 
                    message: "You must complete your Fest Payment before registering." 
                });
            }
        } 
        else if (event.participationType === 'group') {
            // Validate Team Name
            if (!teamName) return res.status(400).json({ message: "Team Name is required for group events." });

            // Validate Input Array
            let membersList = [];
            if (typeof teamMemberIds === 'string') {
                try { membersList = JSON.parse(teamMemberIds); } catch(e) { membersList = []; }
            } else if (Array.isArray(teamMemberIds)) {
                membersList = teamMemberIds;
            }

            // Validate Team Size (Count leader + members)
            const totalSize = 1 + membersList.length;
            if (totalSize < event.minTeamSize || totalSize > event.maxTeamSize) {
                return res.status(400).json({ 
                    message: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}. You have ${totalSize}.` 
                });
            }

            // CHECK 2: Leader Payment Check
            if (user.paymentStatus !== 'verified') {
                return res.status(403).json({ 
                    message: "You (Team Leader) have not verified your Fest Payment yet." 
                });
            }

            // Verify Team Members
            if (membersList.length > 0) {
                // Find users by Jnanagni IDs
                const teammates = await User.find({ jnanagniId: { $in: membersList } });

                // Check if all IDs were valid
                if (teammates.length !== membersList.length) {
                    return res.status(400).json({ message: "One or more Team Member IDs are invalid." });
                }

                // CHECK 3: Teammate Payment & Duplicate Check
                for (const mate of teammates) {
                    // 3a. Cannot add yourself
                    if (mate._id.toString() === user._id.toString()) {
                        return res.status(400).json({ message: "You cannot add yourself as a teammate." });
                    }

                    // 3b. Payment Check
                    if (mate.paymentStatus !== 'verified') {
                        return res.status(403).json({ 
                            message: `Teammate ${mate.name} (${mate.jnanagniId}) has not verified their payment.` 
                        });
                    }

                    finalTeamMemberDbIds.push(mate._id);
                }
            }
        }

        // ==========================================
        // VALIDATION: DUPLICATE PARTICIPATION
        // ==========================================
        
        // We need to ensure that NEITHER the leader NOR any teammate 
        // is already part of another registration for THIS event.
        
        const allParticipantsToCheck = [user._id, ...finalTeamMemberDbIds];

        const existingConflict = await Registration.findOne({
            event: eventId,
            $or: [
                { user: { $in: allParticipantsToCheck } },        // Is anyone a Leader elsewhere?
                { teamMembers: { $in: allParticipantsToCheck } }  // Is anyone a Member elsewhere?
            ]
        }).populate('user', 'name jnanagniId');

        if (existingConflict) {
            return res.status(400).json({ 
                message: "One or more students are already registered for this event in another team." 
            });
        }

        // --- NEW LOGIC: Process Uploaded Files ---
        if (req.files && req.files.length > 0) {
            const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
            
            req.files.forEach(file => {
                // file.fieldname corresponds to the form field name (e.g., "resume")
                // Store the full accessible URL
                submissionData[file.fieldname] = baseUrl + file.filename;
            });
        }
        // -----------------------------------------

        const newRegistration = await Registration.create({
            user: user._id, 
            event: eventId,
            submissionData,
            teamName: event.participationType === 'group' ? teamName : undefined,
            teamMembers: finalTeamMemberDbIds // Now includes file URLs
        });

        try {
            await sendRegistrationConfirmation(user, event.name);
            // Optional: Send emails to teammates too?
        } catch (emailErr) {
            console.error("Email error:", emailErr);
        }
        
        res.status(201).json(newRegistration);
    } catch (error) {
        if (error.code === 11000) { 
            return res.status(400).json({ message: 'User is already registered for this event.' });
        }
        res.status(500).json({ message: 'Error registering for event', error });
    }
};

export const getRegistrationsByEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Higher default limit for lists
        const skip = (page - 1) * limit;

        const registrations = await Registration.find({ event: eventId })
            .populate('user', 'name email jnanagniId contactNo')
            .populate('event', 'title date')
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
                limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching registrations', error });
    }
};

export const updateRegistrationStatus = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const { status } = req.body;

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        registration.status = status;
        await registration.save();

        res.status(200).json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Error updating registration status', error });
    }
};

export const getRegistrationsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const registrations = await Registration.find({ user: userId }).populate('event', 'title date venue');
        res.status(200).json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user registrations', error });
    }
};

export const getRegistrationById = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const registration = await Registration.findById(registrationId).populate('user', 'name email').populate('event', 'title date venue');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }
        res.status(200).json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching registration', error });
    }
};

export const deleteRegistration = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const registration = await Registration.findByIdAndDelete(registrationId);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }
        res.status(200).json({ message: 'Registration deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting registration', error });
    }
};

// update registration submission data
export const updateRegistrationSubmissionData = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const { submissionData } = req.body;

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        registration.submissionData = submissionData;
        await registration.save();

        res.status(200).json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Error updating submission data', error });
    }
};