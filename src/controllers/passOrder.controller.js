import { PassOrder } from "../models/passOrder.model.js";
import { Pass } from "../models/pass.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// --- Purchase a new pass ---
export const purchasePass = asyncHandler(async (req, res) => {
  const { userId, passId, amountPaid, paymentMethod, transactionId, remarks } =
    req.body;

  // Validation
  if (!userId || !passId || amountPaid === undefined || !paymentMethod) {
    throw new ApiError(
      400,
      "Missing required fields: userId, passId, amountPaid, paymentMethod"
    );
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Verify pass exists
  const pass = await Pass.findById(passId);
  if (!pass) throw new ApiError(404, "Pass not found");

  // Check if user already owns this pass
  const alreadyOwnsPass = user.purchasedPasses.some(
    (id) => id.toString() === passId
  );
  if (alreadyOwnsPass) {
    throw new ApiError(400, "User already owns this pass. Use upgrade endpoint.");
  }

  // Verify payment amount matches pass price
  if (amountPaid < pass.price) {
    throw new ApiError(
      400,
      `Insufficient payment. Pass costs ₹${pass.price}, but only ₹${amountPaid} was paid`
    );
  }

  // Create pass order
  const passOrder = await PassOrder.create({
    userId,
    passId,
    amountPaid,
    transactionType: "purchase",
    paymentMethod,
    paymentStatus: "completed",
    transactionId: transactionId || null,
    remarks: remarks || null,
    creditedAmount: 0,
    previousPassId: null,
  });

  // Add pass to user's purchased passes
  user.purchasedPasses.push(passId);
  user.paymentStatus = "verified";
  await user.save();

  // Populate references for response
  await passOrder.populate(["userId", "passId"]);

  res.status(201).json(
    new ApiResponse(201, passOrder, `Pass '${pass.name}' purchased successfully`)
  );
});

// --- Upgrade pass to supersaver ---
export const upgradeToSupersaver = asyncHandler(async (req, res) => {
  const {
    userId,
    currentPassId,
    newPassId,
    amountPaid,
    creditedAmount,
    paymentMethod,
    transactionId,
    remarks,
  } = req.body;

  // Validation
  if (
    !userId ||
    !currentPassId ||
    !newPassId ||
    amountPaid === undefined ||
    !paymentMethod
  ) {
    throw new ApiError(
      400,
      "Missing required fields: userId, currentPassId, newPassId, amountPaid, paymentMethod"
    );
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Verify current pass exists
  const currentPass = await Pass.findById(currentPassId);
  if (!currentPass) throw new ApiError(404, "Current pass not found");

  // Verify new pass is supersaver
  const newPass = await Pass.findById(newPassId);
  if (!newPass) throw new ApiError(404, "New pass not found");
  if (newPass.type !== "supersaver") {
    throw new ApiError(400, "Can only upgrade to Supersaver pass");
  }

  // Check if user owns the current pass
  const ownsCurrentPass = user.purchasedPasses.some(
    (id) => id.toString() === currentPassId
  );
  if (!ownsCurrentPass) {
    throw new ApiError(400, "User does not own the current pass");
  }

  // Check if user already owns supersaver
  const alreadyOwnsSuperSaver = user.purchasedPasses.some(
    (id) => id.toString() === newPassId
  );
  if (alreadyOwnsSuperSaver) {
    throw new ApiError(400, "User already owns the Supersaver pass");
  }

  // Verify upgrade cost calculation
  const upgradeCost = newPass.price - (creditedAmount || 0);
  if (amountPaid !== upgradeCost) {
    throw new ApiError(
      400,
      `Upgrade cost mismatch. Expected ₹${upgradeCost} but got ₹${amountPaid}. Credit amount: ₹${creditedAmount || 0}`
    );
  }

  // Create pass order for upgrade
  const passOrder = await PassOrder.create({
    userId,
    passId: newPassId,
    amountPaid,
    transactionType: "upgrade",
    paymentMethod,
    paymentStatus: "completed",
    transactionId: transactionId || null,
    remarks: remarks || null,
    previousPassId: currentPassId,
    creditedAmount: creditedAmount || 0,
  });

  // Replace old pass with new supersaver pass
  user.purchasedPasses = user.purchasedPasses.map((id) =>
    id.toString() === currentPassId ? newPassId : id
  );
  user.paymentStatus = "verified";
  await user.save();

  // Populate references for response
  await passOrder.populate(["userId", "passId", "previousPassId"]);

  res.status(201).json(
    new ApiResponse(
      201,
      passOrder,
      `Pass upgraded to '${newPass.name}' successfully`
    )
  );
});

// --- Get all pass orders for a user ---
export const getUserPassOrders = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Fetch all pass orders for this user
  const passOrders = await PassOrder.find({ userId })
    .populate("passId")
    .populate("previousPassId")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        passOrders,
        `Retrieved ${passOrders.length} pass orders for user`
      )
    );
});

// --- Get all pass orders (Admin)
export const getAllPassOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, transactionType, paymentStatus } = req.query;

  const filter = {};
  if (transactionType) filter.transactionType = transactionType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (page - 1) * limit;

  const [passOrders, totalCount] = await Promise.all([
    PassOrder.find(filter)
      .populate("userId", "name email")
      .populate("passId", "name type price")
      .populate("previousPassId", "name type price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PassOrder.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json(
    new ApiResponse(200, {
      passOrders,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        limit: Number(limit),
      },
    })
  );
});

// --- Get pass order details by order ID ---
export const getPassOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const passOrder = await PassOrder.findById(orderId)
    .populate("userId")
    .populate("passId")
    .populate("previousPassId");

  if (!passOrder) throw new ApiError(404, "Pass order not found");

  res.status(200).json(new ApiResponse(200, passOrder, "Order details fetched"));
});

// --- Get user's current passes and upgrade eligibility ---
export const getUserPassStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate("purchasedPasses");
  if (!user) throw new ApiError(404, "User not found");

  const allPasses = await Pass.find({ isActive: true });
  const supersaverPass = allPasses.find((p) => p.type === "supersaver");

  // Get user's current passes
  const currentPasses = user.purchasedPasses || [];

  // Check if user has supersaver
  const hasSupersaver = currentPasses.some(
    (p) => p._id.toString() === supersaverPass?._id.toString()
  );

  // Upgrade options for each current pass (except supersaver)
  const upgradeOptions = currentPasses
    .filter((p) => p.type !== "supersaver")
    .map((pass) => ({
      currentPass: {
        id: pass._id,
        name: pass.name,
        type: pass.type,
        price: pass.price,
      },
      upgradeTo: supersaverPass && {
        id: supersaverPass._id,
        name: supersaverPass.name,
        type: supersaverPass.type,
        price: supersaverPass.price,
        remainingAmount: supersaverPass.price - pass.price,
      },
    }));

  res.status(200).json(
    new ApiResponse(200, {
      userId,
      currentPasses,
      hasSupersaver,
      upgradeOptions,
    })
  );
});
