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
eventRouter.get('/:id', getEventById);
eventRouter.get('/category/:categoryId', getEventsByCategory);


// ==========================================
// PROTECTED ROUTES (Student/User Actions)
// ==========================================

// Register for an event
eventRouter.post('/register', protect, upload.any(), registerForEvent);

// Get my registrations
eventRouter.get('/registrations/me/:userId', protect, getRegistrationsByUser); 

// Get specific registration details
eventRouter.get('/registrations/:id', protect, getRegistrationById);

// Update submission data (e.g., adding a github link later)
eventRouter.put('/registrations/:id/submission', protect, updateRegistrationSubmissionData);

export { eventRouter };