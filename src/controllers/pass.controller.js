import { Pass } from "../models/pass.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// --- ADMIN: Create/Update Pass Configs ---
export const createOrUpdatePass = asyncHandler(async (req, res) => {
    const { name, type, price, description } = req.body;
    let qrCodePath;

    if (req.file) {
        qrCodePath = req.file.path;
    }

    // Validation: If creating new, QR is mandatory. If updating, it's optional (keep old).
    if (!qrCodePath) {
        const existing = await Pass.findOne({ type });
        if (!existing) {
             throw new ApiError(400, "QR Code image is required for a new pass.");
        }
    }

    const updateData = { name, type, price, description, isActive: true };
    
    // Only update QR if a new file was uploaded
    if (qrCodePath) {
        updateData.qrCode = qrCodePath;
    }

    const pass = await Pass.findOneAndUpdate(
        { type }, 
        updateData,
        { new: true, upsert: true } 
    );

    res.status(200).json(new ApiResponse(200, pass, "Pass configured successfully"));
});

export const getAllPasses = asyncHandler(async (req, res) => {
    const passes = await Pass.find({ isActive: true });
    res.status(200).json(new ApiResponse(200, passes, "Passes fetched"));
});

// --- USER/ADMIN: Assign Pass to User (Simulate Purchase) ---
export const assignPassToUser = asyncHandler(async (req, res) => {
    const { userId, passId } = req.body; 

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const pass = await Pass.findById(passId);
    if (!pass) throw new ApiError(404, "Pass configuration not found");

    // 1. Check if user already has this specific pass
    const alreadyHasPass = user.purchasedPasses.some(
        (ownedPassId) => ownedPassId.toString() === pass._id.toString()
    );

    if (alreadyHasPass) {
        throw new ApiError(400, "User already owns this pass");
    }

    user.purchasedPasses.push(pass._id);

    // 2. Logic for Supersaver (The "Upgrade")
    // If user buys Supersaver, we can optionally clear other passes since Supersaver covers all
    // OR we just push it. Pushing it is safer for history tracking.
    
    // 3. Add the pass
    user.purchasedPasses.push(pass._id);
    
    // 4. Ensure payment status is verified
    user.paymentStatus = "verified"; 
    
    await user.save();

    res.status(200).json(new ApiResponse(200, user, `Pass '${pass.name}' added to user account.`));
});

export const removePassFromUser = asyncHandler(async (req, res) => {
    const { userId, passId } = req.body;

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // Filter out the pass to remove
    user.purchasedPasses = user.purchasedPasses.filter(
        id => id.toString() !== passId
    );

    await user.save();
    res.status(200).json(new ApiResponse(200, user, "Pass removed successfully"));
});

// --- ADMIN: Delete Pass (removes from all users) ---
export const deletePass = asyncHandler(async (req, res) => {
    const { passId } = req.body;

    // Verify the pass exists before deleting
    const pass = await Pass.findById(passId);
    if (!pass) throw new ApiError(404, "Pass not found");

    // Remove the pass from all users who have it
    await User.updateMany(
        { purchasedPasses: passId },
        { $pull: { purchasedPasses: passId } }
    );

    // Delete the pass itself
    await Pass.findByIdAndDelete(passId);

    res.status(200).json(new ApiResponse(200, null, "Pass deleted successfully and removed from all users"));
});