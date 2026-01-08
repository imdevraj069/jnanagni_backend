import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/access.middleware.js';
import { verifyEventStaffAccess } from '../middlewares/ownership.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

// Controllers
import {
  submitVolunteerRequest,
  getVolunteerRequestsByEvent,
  updateVolunteerRequestStatus,
  getMyVolunteerRequests,
} from '../controllers/volunteerRequest.controller.js';

const volunteerRequestRouter = Router();

// Student submits volunteer request
// POST /api/v1/volunteer-requests/submit/:eventId
volunteerRequestRouter.post(
  '/submit/:eventId',
  protect,
  upload.any(), // Allow file uploads for volunteer form
  submitVolunteerRequest
);

// Get all volunteer requests for an event (Staff Only)
// GET /api/v1/volunteer-requests/event/:eventId
volunteerRequestRouter.get(
  '/event/:eventId',
  protect,
  verifyEventStaffAccess, // Checks admin/lead/coordinator/volunteer
  getVolunteerRequestsByEvent
);

// Update volunteer request status (Staff Only)
// PUT /api/v1/volunteer-requests/:id
volunteerRequestRouter.put(
  '/:id',
  protect,
  verifyEventStaffAccess, // Will verify via eventId injection
  updateVolunteerRequestStatus
);

// Get my volunteer requests (Student Only)
// GET /api/v1/volunteer-requests/my-requests
volunteerRequestRouter.get(
  '/my-requests',
  protect,
  getMyVolunteerRequests
);

export default volunteerRequestRouter;
