import express from "express";
import {
  requestPassPurchase,     // Changed from purchasePass
  requestPassUpgrade,      // Changed from upgradeToSupersaver
  verifyPassOrder,         // New
  rejectPassOrder,         // New
  getUserPassOrders,
  getAllPassOrders,
  getPassOrderDetails,
  getUserPassStatus,
} from "../controllers/passOrder.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";

const router = express.Router();

// --- Public (Student/Outsider) Routes ---
// Submit a purchase request (Pending)
router.post("/purchase", protect, requestPassPurchase);

// Submit an upgrade request (Pending)
router.post("/upgrade", protect, requestPassUpgrade);

// Get my status and eligibility
router.get("/status/:userId", protect, getUserPassStatus);
router.get("/user/:userId", protect, getUserPassOrders);
router.get("/orders/:orderId", protect, getPassOrderDetails);

// --- Admin Routes (Finance/Admin) ---

// View all orders (to find pending ones)
router.get("/", protect, authorize("admin", "finance_team"), getAllPassOrders);

// Verify/Approve Order
router.put(
    "/verify/:orderId", 
    protect, 
    authorize("admin", "finance_team"), 
    verifyPassOrder
);

// Reject Order
router.put(
    "/reject/:orderId", 
    protect, 
    authorize("admin", "finance_team"), 
    rejectPassOrder
);

export default router;