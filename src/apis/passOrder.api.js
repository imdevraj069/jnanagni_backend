import express from "express";
import {
  purchasePass,
  upgradeToSupersaver,
  getUserPassOrders,
  getAllPassOrders,
  getPassOrderDetails,
  getUserPassStatus,
} from "../controllers/passOrder.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- Public Routes (Protected) ---

// Purchase a new pass
router.post("/purchase", protect, purchasePass);

// Upgrade to supersaver
router.post("/upgrade", protect, upgradeToSupersaver);

// Get user's pass status and upgrade eligibility
router.get("/status/:userId", protect, getUserPassStatus);

// Get all pass orders for a user
router.get("/user/:userId", protect, getUserPassOrders);

// Get pass order details
router.get("/:orderId", protect, getPassOrderDetails);

// --- Admin Routes ---

// Get all pass orders with pagination and filters
router.get("/", protect, getAllPassOrders);

export default router;
