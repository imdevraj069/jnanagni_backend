import { Pass } from "../models/pass.model.js";
import { PassOrder } from "../models/passOrder.model.js"
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// ==========================================
// ADMIN: CREATE / EDIT / UPDATE PASS
// ==========================================
export const createOrUpdatePass = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { name, type, price, description } = req.body;
    
    // 1. Determine UPI ID: Use body value OR env fallback
    const reqUpiId = req.body.upiId || process.env.DEFAULT_UPI_ID;

    // 2. Prepare base update data
    const updateData = { name, type, price, description, isActive: true };

    // 3. Handle Payment URL Logic
    if (reqUpiId) {
        // CASE A: We have a UPI ID (New Pass OR Updating UPI)
        updateData.upiId = reqUpiId;
        updateData.paymentUrl = `upi://pay?pa=${reqUpiId}&pn=Jnanagni&am=${price}&cu=INR`;
    } else {
        // CASE B: No UPI ID provided (Updating Price/Description only?)
        // We MUST fetch the existing pass to get the old UPI ID so we can update the price in the URL.
        const existingPass = await Pass.findOne({ type });

        if (!existingPass) {
             throw new ApiError(400, "UPI ID is required to create a new pass configuration.");
        }
        
        // Re-generate URL with NEW price but OLD UPI ID
        updateData.paymentUrl = `upi://pay?pa=${existingPass.upiId}&pn=Jnanagni&am=${price}&cu=INR`;
    }

    // 4. Perform Update (Upsert = Create if not exists, Update if exists)
    const pass = await Pass.findOneAndUpdate(
        { type }, 
        updateData,
        { new: true, upsert: true, setDefaultsOnInsert: true } 
    );

    res.status(200).json(new ApiResponse(200, pass, "Pass configured successfully"));
});

// ==========================================
// PUBLIC: GET ALL PASSES
// ==========================================
export const getAllPasses = asyncHandler(async (req, res) => {
    const passes = await Pass.find({ isActive: true });
    res.status(200).json(new ApiResponse(200, passes, "Passes fetched"));
});

// ==========================================
// ADMIN: MANUAL ASSIGNMENT
// ==========================================
export const assignPassToUser = asyncHandler(async (req, res) => {
    const { userId, passId } = req.body; 

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const pass = await Pass.findById(passId);
    if (!pass) throw new ApiError(404, "Pass configuration not found");

    const alreadyHasPass = user.purchasedPasses.some(
        (ownedPassId) => ownedPassId.toString() === pass._id.toString()
    );

    if (alreadyHasPass) {
        throw new ApiError(400, "User already owns this pass");
    }

    user.purchasedPasses.push(pass._id);
    user.paymentStatus = "verified"; 
    
    await user.save();

    res.status(200).json(new ApiResponse(200, user, `Pass '${pass.name}' added to user account.`));
});

// ==========================================
// ADMIN: REVOKE PASS
// ==========================================
export const removePassFromUser = asyncHandler(async (req, res) => {
    const { userId, passId } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    
    user.purchasedPasses = user.purchasedPasses.filter(id => id.toString() !== passId);
    await user.save();
    
    res.status(200).json(new ApiResponse(200, user, "Pass removed successfully"));
});

// ==========================================
// ADMIN: DELETE PASS CONFIG
// ==========================================
export const deletePass = asyncHandler(async (req, res) => {
    const { passId } = req.body;
    
    const pass = await Pass.findById(passId);
    if (!pass) throw new ApiError(404, "Pass not found");
    
    // Remove reference from all users
    await User.updateMany({ purchasedPasses: passId }, { $pull: { purchasedPasses: passId } });

    //delete all related pass orders after taking bakup of them
    const relatedOrders = await PassOrder.find({ pass: passId });
    //save records in upload directory upload/backup/passOrders_backup_<timestamp>.json
    const fs = await import('fs');
    const path = `./uploads/backup/passOrders_backup_${Date.now()}.json`;
    fs.writeFileSync(path, JSON.stringify(relatedOrders, null, 2));

    await PassOrder.deleteMany({ pass: passId });
    
    // Delete the pass document
    await Pass.findByIdAndDelete(passId);
    
    res.status(200).json(new ApiResponse(200, null, "Pass deleted successfully"));
});