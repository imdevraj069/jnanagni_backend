import { Router } from "express";
import { 
    getAllEventCategories, 
    getEventCategoryById,
    getAllEvents,
    getEventById,
    getEventsByCategory
} from "../controllers/event.controller.js";
import { 
    registerForEvent, 
    getRegistrationsByUser, 
    getRegistrationById,
    inviteMember,      // Imported
    respondToInvite,   // Imported
    removeMember,      // Imported
    getMyInvites,      // Imported
    deleteRegistration, // Imported
    updateRegistrationSubmissionData
} from "../controllers/registration.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const eventRouter = Router();

// ==========================================
// PUBLIC ROUTES (No Token Required)
// ==========================================

// --- Categories ---
eventRouter.get('/categories', getAllEventCategories);
eventRouter.get('/categories/:id', getEventCategoryById);

// --- Events ---
eventRouter.get('/', getAllEvents);
eventRouter.get('/find/:id', getEventById);
eventRouter.get('/category/:categoryId', getEventsByCategory);


// ==========================================
// PROTECTED ROUTES (Student/User Actions)
// ==========================================

// 1. Main Register (Solo or Group Leader)
eventRouter.post('/register', protect, upload.any(), registerForEvent);

// 2. Team Management (Leader Actions)
eventRouter.post('/team/:registrationId/invite', protect, inviteMember);
eventRouter.delete('/team/:registrationId/remove/:memberId', protect, removeMember);
eventRouter.delete('/registrations/:id', protect, deleteRegistration); // Dissolve Team

// 3. Member Actions
eventRouter.get('/my-invites', protect, getMyInvites); // View pending invites
eventRouter.post('/team/:registrationId/respond', protect, respondToInvite); // Accept/Reject

// 4. View Data
eventRouter.get('/registrations/me/:userId', protect, getRegistrationsByUser); 
eventRouter.get('/registrations/:id', protect, getRegistrationById);

// Update submission data (e.g., adding a github link later)
eventRouter.put('/registrations/:id/submission', protect, updateRegistrationSubmissionData);

export { eventRouter };