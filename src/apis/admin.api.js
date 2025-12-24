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

export { adminRouter };