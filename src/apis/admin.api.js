import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";
import { getDashboardStats, getAnalyticsData, adminVerifyUserEmail } from "../controllers/admin.controller.js";
import {upload} from "../middlewares/upload.middleware.js";

// --- NEW IMPORT ---
import { 
    verifyCategoryOwnership, 
    verifyEventAuthority, 
    verifyEventStaffAccess 
} from "../middlewares/ownership.middleware.js";

// Controllers
import { 
    createEventCategory, 
    updateEventCategory, 
    deleteEventCategory
} from "../controllers/event.controller.js";

import { 
    createEvent, 
    updateEvent, 
    deleteEvent, 
    addCoordinatorToEvent,
    addVolunteerToEvent,
    getAllEvents,
    getEventById
} from "../controllers/event.controller.js";

import { 
    getRegistrationsByEvent, 
    updateRegistrationStatus,
    deleteRegistration,
    getAllRegistrations
} from "../controllers/registration.controller.js";
import {
  getVolunteerRequestsByEvent,
  updateVolunteerRequestStatus,
} from "../controllers/volunteerRequest.controller.js";

import { alertIncompleteTeams } from "../controllers/admin.controller.js"; // Import alert function

const adminRouter = Router();

// Apply global protection to all admin routes
adminRouter.use(protect);

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================
adminRouter.get('/stats/overview', authorize('admin', 'finance_team'), getDashboardStats);
adminRouter.get('/stats/analytics', authorize('admin'), getAnalyticsData);

// ==========================================
// USER MANAGEMENT
// ==========================================
adminRouter.post('/users/verify-email', authorize('admin'), adminVerifyUserEmail);

adminRouter.get('/events', authorize('admin', 'category_lead', 'event_coordinator'), getAllEvents);
adminRouter.get('/events/:id', authorize('admin', 'category_lead', 'event_coordinator'), getEventById);

// ==========================================
// EVENT CATEGORY MANAGEMENT
// ==========================================
adminRouter.post(
    '/categories', 
    authorize('admin', 'category_lead'),
    upload.single('banner'), // For category banner upload
    createEventCategory
);

// Update: Ensure Category Lead owns this category
adminRouter.put(
    '/categories/:id', 
    authorize('admin', 'category_lead'), 
    verifyCategoryOwnership, // <--- Added
    upload.single('banner'), // For category banner upload
    updateEventCategory
);

adminRouter.delete(
    '/categories/:id', 
    authorize('admin'), 
    deleteEventCategory
); 


// ==========================================
// EVENT MANAGEMENT
// ==========================================

const eventUploads = upload.fields([
    { name: 'poster', maxCount: 1 }, 
    { name: 'rulesetFile', maxCount: 1 }
]);

// Create: Ensure Category Lead owns the category they are adding an event to
adminRouter.post(
    '/events', 
    authorize('admin', 'category_lead'), 
    verifyCategoryOwnership, // <--- Checks req.body.categoryId
    eventUploads,
    createEvent
);

// Update: Coordinators & Leads can only update their own events
adminRouter.put(
    '/events/:id', 
    authorize('admin', 'category_lead', 'event_coordinator'), 
    verifyEventAuthority, // <--- Added
    eventUploads,
    updateEvent
);

// Delete: Leads can delete events in their category
adminRouter.delete(
    '/events/:id', 
    authorize('admin', 'category_lead'), 
    verifyEventAuthority, // <--- Added
    deleteEvent
);

// Assign Coordinator
adminRouter.post(
    '/events/:id/coordinator', 
    authorize('admin', 'category_lead'), 
    verifyEventAuthority, // <--- Added (Only Lead of this category can add cords)
    addCoordinatorToEvent
);

// Assign Volunteer
adminRouter.post(
    '/events/:id/volunteer', 
    authorize('admin', 'category_lead', 'event_coordinator'), 
    verifyEventAuthority, 
    addVolunteerToEvent
);

// ==========================================
// REGISTRATION MANAGEMENT (The "Scanner" & "Desk" Ops)
// ==========================================

// View Registrations: Restricted to assigned Staff (Volunteers/Coords/Leads)
adminRouter.get(
    '/events/:eventId/registrations', 
    authorize('admin', 'category_lead', 'event_coordinator', 'volunteer'), 
    verifyEventStaffAccess, // <--- Added
    getRegistrationsByEvent
);

// Update Status: Coordinators & Leads only
adminRouter.put(
    '/registrations/:id/status', 
    authorize('admin', 'category_lead', 'event_coordinator'),
    // Note: We might need to fetch the event from the registration to verify ownership here,
    // but usually, coordinators access this via the dashboard of their specific event.
    // If strict security is needed per registration ID, we would need a specific middleware 
    // to lookup Registration -> Event -> Check User. 
    updateRegistrationStatus
);

// Force delete a registration
adminRouter.delete(
    '/registrations/:id', 
    authorize('admin'), 
    deleteRegistration
);

// ==========================================
// ROLE-LIMITED DATA ACCESS ROUTES
// ==========================================

// Get categories limited to lead (lead can see only his categories)
adminRouter.get(
    '/my-categories', 
    authorize('admin', 'category_lead'),
    async (req, res) => {
        try {
            const categories = await (await import("../models/eventcategory.model.js")).EventCategory
                .find({ lead: req.user._id })
                .populate("lead", "name email jnanagniId")
                .populate("createdby", "name email");
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: "Error fetching categories", error });
        }
    }
);

// Get events limited to coordinator (coordinator can see only his events)
adminRouter.get(
    '/my-events', 
    authorize('admin', 'category_lead', 'event_coordinator'),
    async (req, res) => {
        try {
            const Event = (await import("../models/event.model.js")).Event;
            
            // 1. CHECK FOR ADMIN (The Fix)
            // If user has 'admin' in specialRoles OR is a main admin
            if (req.user.specialRoles.includes('admin') || req.user.role === 'admin') {
                 const allEvents = await Event.find()
                    .populate("category", "name")
                    .populate("coordinators", "name email jnanagniId")
                    .populate("volunteers", "name email jnanagniId")
                    .sort({ createdAt: -1 });
                 
                 return res.status(200).json(allEvents);
            }

            // 2. EXISTING LOGIC (For Leads & Coordinators)
            // Finds events where user is coord OR user is lead of the category
            const events = await Event
                .find({
                    $or: [
                        { coordinators: req.user._id },
                        { category: { $in: (await (await import("../models/eventcategory.model.js")).EventCategory.find({ lead: req.user._id })).map(c => c._id) } }
                    ]
                })
                .populate("category", "name")
                .populate("coordinators", "name email jnanagniId")
                .populate("volunteers", "name email jnanagniId");
                
            res.status(200).json(events);
        } catch (error) {
            res.status(500).json({ message: "Error fetching events", error });
        }
    }
);

// Get registrations limited to volunteer (volunteer can see only his event registrations)
adminRouter.get(
    '/my-registrations', 
    authorize('admin', 'volunteer', 'event_coordinator', 'category_lead'),
    async (req, res) => {
        try {
            const Registration = (await import("../models/registration.model.js")).Registration;
            const Event = (await import("../models/event.model.js")).Event;
            
            // Get events where user is volunteer/coordinator
            const events = await Event.find({
                $or: [
                    { volunteers: req.user._id },
                    { coordinators: req.user._id }
                ]
            });
            
            const eventIds = events.map(e => e._id);
            const registrations = await Registration
                .find({ event: { $in: eventIds } })
                .populate("user", "name email jnanagniId")
                .populate("event", "name");
            
            res.status(200).json(registrations);
        } catch (error) {
            res.status(500).json({ message: "Error fetching registrations", error });
        }
    }
);

// VOLUNTEER REQUEST MANAGEMENT
// View volunteer requests for a specific event
adminRouter.get(
  "/events/:eventId/volunteer-requests",
  authorize("admin", "categorylead", "eventcoordinator"),
  verifyEventStaffAccess, // ensures lead/coord belong to the event
  getVolunteerRequestsByEvent
);

// Update volunteer request status (approve/reject)
adminRouter.put(
  "/volunteer-requests/:id/status",
  authorize("admin", "categorylead", "eventcoordinator"),
  updateVolunteerRequestStatus
);

adminRouter.get('/registrations',
    authorize('admin', 'finance_team'),
    getAllRegistrations
);

// ==========================================
// TEAM ALERTS
// ==========================================
// Notify teams that don't meet minimum size requirements
adminRouter.post(
    '/events/:eventId/alert-incomplete', 
    authorize('admin', 'category_lead', 'event_coordinator'), 
    verifyEventAuthority, 
    alertIncompleteTeams
);

export { adminRouter };
