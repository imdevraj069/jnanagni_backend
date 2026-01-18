import { PassOrder } from "../models/passOrder.model.js";
import { Pass } from "../models/pass.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  sendPassPurchaseConfirmation,
  sendPassRejectionEmail,
} from "../services/email.service.js";

// ==========================================
// USER ROUTES (Requesting Access)
// ==========================================

// --- 1. Request Purchase (SECURE: Backend Sets Price) ---
export const requestPassPurchase = asyncHandler(async (req, res) => {
  // IGNORE amountPaid from frontend
  const { userId, passId, paymentMethod, transactionId, remarks } = req.body;

  if (!userId || !passId || !paymentMethod || !transactionId) {
    throw new ApiError(
      400,
      "Missing required fields: userId, passId, paymentMethod, transactionId",
    );
  }

  // 1. Check UTR Uniqueness
  const existingUTR = await PassOrder.findOne({ transactionId });
  if (existingUTR) {
    throw new ApiError(409, "This Transaction ID (UTR) has already been used.");
  }

  // 2. Verify User & Pass
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const pass = await Pass.findById(passId);
  if (!pass) throw new ApiError(404, "Pass not found");

  if (!pass.isActive) {
    throw new ApiError(400, "This pass is not currently active.");
  }

  // 3. Check Ownership
  const alreadyOwnsPass = user.purchasedPasses.some(
    (id) => id.toString() === passId,
  );
  if (alreadyOwnsPass) {
    throw new ApiError(
      400,
      "You already own this pass. Use the upgrade option if needed.",
    );
  }

  // 4. Create Pending Order using DATABASE PRICE
  const passOrder = await PassOrder.create({
    userId,
    passId,
    amountPaid: pass.price, // <--- TRUST DB PRICE
    transactionType: "purchase",
    paymentMethod,
    paymentStatus: "pending",
    transactionId,
    remarks,
    creditedAmount: 0,
    previousPassId: null,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        passOrder,
        "Purchase request submitted. Verification pending.",
      ),
    );
});

// --- 2. Request Upgrade (SECURE: Backend Sets Price) ---
export const requestPassUpgrade = asyncHandler(async (req, res) => {
  // IGNORE amountPaid from frontend
  const {
    userId,
    currentPassId,
    newPassId,
    transactionId,
    paymentMethod,
    remarks,
  } = req.body;

  if (!userId || !currentPassId || !newPassId || !transactionId) {
    throw new ApiError(400, "Missing required fields.");
  }

  const existingUTR = await PassOrder.findOne({ transactionId });
  if (existingUTR) {
    throw new ApiError(409, "This Transaction ID (UTR) has already been used.");
  }

  const user = await User.findById(userId);
  const currentPass = await Pass.findById(currentPassId);
  const newPass = await Pass.findById(newPassId);

  if (!user || !currentPass || !newPass)
    throw new ApiError(404, "Details not found");

  if (newPass.type !== "supersaver") {
    throw new ApiError(
      400,
      "Upgrades are only allowed for the Supersaver pass.",
    );
  }

  const ownsCurrentPass = user.purchasedPasses.some(
    (id) => id.toString() === currentPassId,
  );
  if (!ownsCurrentPass)
    throw new ApiError(400, "You do not own the pass you are upgrading from.");

  // CALCULATE DIFFERENCE ON SERVER
  const priceDifference = Math.max(0, newPass.price - currentPass.price);

  const passOrder = await PassOrder.create({
    userId,
    passId: newPassId,
    amountPaid: priceDifference, // <--- TRUST CALCULATED PRICE
    transactionType: "upgrade",
    paymentMethod,
    paymentStatus: "pending",
    transactionId,
    remarks,
    previousPassId: currentPassId,
    creditedAmount: currentPass.price,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        passOrder,
        "Upgrade request submitted. Verification pending.",
      ),
    );
});

// ==========================================
// ADMIN ROUTES (Verification) - Unchanged from previous correct version
// ==========================================

export const verifyPassOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await PassOrder.findById(orderId)
    .populate("passId")
    .populate("userId");
  if (!order) throw new ApiError(404, "Order not found");

  if (order.paymentStatus === "completed") {
    throw new ApiError(400, "Order is already verified.");
  }

  order.paymentStatus = "completed";
  await order.save();

  const user = await User.findById(order.userId._id);
  user.purchasedPasses.addToSet(order.passId._id);

  // Clean up old pass if upgrading
  if (order.transactionType === "upgrade" && order.previousPassId) {
    user.purchasedPasses = user.purchasedPasses.filter(
      (pid) => pid.toString() !== order.previousPassId.toString(),
    );
    user.purchasedPasses.addToSet(order.passId._id);
  }

  if (user.paymentStatus !== "verified") {
    user.paymentStatus = "verified";
  }

  await user.save();

  try {
    await sendPassPurchaseConfirmation(user, order.passId, order.transactionId);
  } catch (e) {
    console.error("Email failed", e);
  }

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order verified and pass assigned."));
});

export const rejectPassOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { adminComments } = req.body;

  const order = await PassOrder.findById(orderId)
    .populate("userId")
    .populate("passId");
  if (!order) throw new ApiError(404, "Order not found");

  if (order.paymentStatus !== "pending") {
    throw new ApiError(400, "Can only reject pending orders.");
  }

  order.paymentStatus = "rejected";
  order.adminComments = adminComments || "Payment verification failed.";
  await order.save();

  try {
    const reason = adminComments || "Verification failed.";
    await sendPassRejectionEmail(order.userId, order.passId, reason);
  } catch (e) {
    console.error("Email failed", e);
  }

  res.status(200).json(new ApiResponse(200, order, "Order rejected."));
});

// ... (Getters: getAllPassOrders, getPassOrderDetails, getUserPassOrders, getUserPassStatus remain unchanged) ...

export const getAllPassOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, transactionType, paymentStatus } = req.query;

  const filter = {};
  if (transactionType) filter.transactionType = transactionType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (page - 1) * limit;

  const [passOrders, totalCount] = await Promise.all([
    PassOrder.find(filter)
      .populate("userId", "name email jnanagniId contactNo")
      .populate("passId", "name type price")
      .populate("previousPassId", "name type price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PassOrder.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      passOrders,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
      },
    }),
  );
});

export const getPassOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const passOrder = await PassOrder.findById(orderId)
    .populate("userId")
    .populate("passId")
    .populate("previousPassId");
  if (!passOrder) throw new ApiError(404, "Order not found");
  res.status(200).json(new ApiResponse(200, passOrder, "Details fetched"));
});

export const getUserPassOrders = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const passOrders = await PassOrder.find({ userId })
    .populate("passId")
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, passOrders, "User orders fetched"));
});

export const getUserPassStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate("purchasedPasses");
  if (!user) throw new ApiError(404, "User not found");

  const allPasses = await Pass.find({ isActive: true });
  const supersaverPass = allPasses.find((p) => p.type === "supersaver");

  const currentPasses = user.purchasedPasses || [];

  const hasSupersaver = currentPasses.some((p) => p.type === "supersaver");

  let upgradeOptions = [];
  if (!hasSupersaver && supersaverPass) {
    upgradeOptions = currentPasses.map((pass) => ({
      currentPassId: pass._id,
      currentPassName: pass.name,
      currentPassPrice: pass.price,
      upgradeToId: supersaverPass._id,
      upgradeToName: supersaverPass.name,
      upgradeToPrice: supersaverPass.price,
      amountToPay: Math.max(0, supersaverPass.price - pass.price),
    }));
  }

  res.status(200).json(
    new ApiResponse(200, {
      userId,
      currentPasses,
      hasSupersaver,
      upgradeOptions,
    }),
  );
});
