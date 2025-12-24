import { Router } from "express";
import { 
    getUserByJnanagniId, 
    verifyPaymentStatus,
    getAllUsers,
    changeUserRole,
    deleteUser,
    getUserById,
    getUsersByRole,
    getUsersBySpecialRole,
    getUnverifiedUsers,
    getUserUnverifiedPayments,
    verifyUserPayment 
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; 
import { authorize } from "../middlewares/access.middleware.js";

export const userRouter = Router();

// ==========================================
// SCANNER & LOOKUP ROUTES
// (Authorized for Volunteers/Staff handling entry or desks)
// ==========================================

// Scan user via Jnanagni ID (e.g., JG25-X9Y2)
// Allowed: Admin, Event Coordinators, Volunteers, Category Leads
userRouter.get(
    "/scan/:jnanagniId", 
    protect, 
    authorize('admin', 'event_coordinator', 'volunteer', 'category_lead'), 
    getUserByJnanagniId
);

// Check payment status of a specific user ID
userRouter.get(
    "/payment-status/:jnanagniId", 
    protect, 
    authorize('admin', 'finance_team', 'event_coordinator', 'volunteer'), 
    verifyPaymentStatus
);

// Get User by Database ID
userRouter.get(
    "/:id", 
    protect, 
    authorize('admin', 'event_coordinator'), 
    getUserById
);


// ==========================================
// FINANCE & PAYMENT MANAGEMENT
// (Strictly Admin & Finance Team)
// ==========================================

// Get all users with pending/unverified payments
userRouter.get(
    "/payments/pending", 
    protect, 
    authorize('admin', 'finance_team'), 
    getUserUnverifiedPayments
);

// Verify a user's payment (Mark as paid)
userRouter.put(
    "/payments/verify/:id", 
    protect, 
    authorize('admin', 'finance_team'), 
    verifyUserPayment
);


// ==========================================
// ADMIN USER MANAGEMENT
// (Strictly Admin)
// ==========================================

// Get All Users
userRouter.get(
    "/all/users", 
    protect, 
    authorize('admin'), 
    getAllUsers
);

// Get Unverified Users (Email not verified)
userRouter.get(
    "/all/unverified", 
    protect, 
    authorize('admin'), 
    getUnverifiedUsers
);

// Filter by Primary Role (student, fetian, etc.)
userRouter.get(
    "/role/:role", 
    protect, 
    authorize('admin'), 
    getUsersByRole
);

// Filter by Special Role (volunteer, admin, etc.)
userRouter.get(
    "/special-role/:specialRole", 
    protect, 
    authorize('admin'), 
    getUsersBySpecialRole
);

// Change User Role
userRouter.put(
    "/role/:id", 
    protect, 
    authorize('admin'), 
    changeUserRole
);

// Delete User
userRouter.delete(
    "/:id", 
    protect, 
    authorize('admin'), 
    deleteUser
);