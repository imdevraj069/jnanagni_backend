import {Registration} from "../models/registration.model.js";


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
            submissionData // Now includes file URLs
        });

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