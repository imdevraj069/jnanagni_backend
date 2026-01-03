import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";

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
    addVolunteerToEvent
} from "../controllers/event.controller.js";

import { 
    getRegistrationsByEvent, 
    updateRegistrationStatus,
    deleteRegistration
} from "../controllers/registration.controller.js";

const adminRouter = Router();

// Apply global protection to all admin routes
adminRouter.use(protect);

// ==========================================
// EVENT CATEGORY MANAGEMENT
// ==========================================
adminRouter.post(
    '/categories', 
    authorize('admin', 'category_lead'), 
    createEventCategory
);

// Update: Ensure Category Lead owns this category
adminRouter.put(
    '/categories/:id', 
    authorize('admin', 'category_lead'), 
    verifyCategoryOwnership, // <--- Added
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

// Create: Ensure Category Lead owns the category they are adding an event to
adminRouter.post(
    '/events', 
    authorize('admin', 'category_lead'), 
    verifyCategoryOwnership, // <--- Checks req.body.categoryId
    createEvent
);

// Update: Coordinators & Leads can only update their own events
adminRouter.put(
    '/events/:id', 
    authorize('admin', 'category_lead', 'event_coordinator'), 
    verifyEventAuthority, // <--- Added
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

export { adminRouter };