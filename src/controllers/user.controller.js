import user from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendPaymentVerificationEmail } from "../services/email.service.js";

// --- GET USER BY JNANAGNI ID (For Scanner) ---
export const getUserByJnanagniId = asyncHandler(async (req, res) => {
    const { jnanagniId } = req.params;

    if (!jnanagniId) {
        throw new ApiError(400, "Jnanagni ID is required");
    }

    // Populate passes to see eligibility at scan time
    const foundUser = await user.findOne({ jnanagniId })
        .select("-password -resetPasswordToken -verificationToken -verificationExpire -__v")
        .populate("purchasedPasses") // <--- Added
        .lean();

    if (!foundUser) {
        throw new ApiError(404, "User not found with this ID");
    }

    res.status(200).json(
        new ApiResponse(200, foundUser, "User details fetched successfully")
    );
});

// verify payment status
export const verifyPaymentStatus = asyncHandler(async (req, res) => {
    const { jnanagniId } = req.params;

    if (!jnanagniId) {
        throw new ApiError(400, "Jnanagni ID is required");
    }

    const foundUser = await user.findOne({ jnanagniId })
        .select("paymentStatus name email jnanagniId")
        .populate("purchasedPasses"); // <--- Added

    if (!foundUser) {
        throw new ApiError(404, "User not found with this ID");
    }

    res.status(200).json(
        new ApiResponse(200, foundUser, "Payment status fetched successfully")
    );
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch paginated users
    const users = await user.find()
        .select("-password -resetPasswordToken -verificationToken -verificationExpire -__v")
        .populate("purchasedPasses") // <--- Added so Admin list shows badges/passes
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(limit)
        .lean();

    const totalDocs = await user.countDocuments();

    res.status(200).json(
        new ApiResponse(200, {
            users,
            pagination: {
                totalDocs,
                totalPages: Math.ceil(totalDocs / limit),
                currentPage: page,
                limit
            }
        }, "All users fetched successfully")
    );
});

export const changeUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, specialRoles } = req.body;
    
    const validRoles = ['student', 'gkvian', 'fetian', 'faculty'];
    const validSpecialRoles = ['event_coordinator', 'volunteer', 'category_lead', 'admin', 'finance_team', 'None'];

    if (role && !validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role specified");
    }

    if (specialRoles) {
        const rolesToCheck = Array.isArray(specialRoles) ? specialRoles : [specialRoles];
        
        const isInvalid = rolesToCheck.some(r => !validSpecialRoles.includes(r));
        if (isInvalid) {
            throw new ApiError(400, "One or more invalid special roles specified");
        }
    }

    const foundUser = await user.findById(id);

    if (!foundUser) {
        throw new ApiError(404, "User not found");
    }

    if (role) foundUser.role = role;
    
    if (specialRoles) {
        const rolesToSet = Array.isArray(specialRoles) ? specialRoles : [specialRoles];
        if (rolesToSet.includes('None')) {
            foundUser.specialRoles = [];
        } else {
            foundUser.specialRoles = rolesToSet;
        }
    }

    await foundUser.save();

    res.status(200).json(
        new ApiResponse(200, foundUser, "User role updated successfully")
    );
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedUser = await user.findByIdAndDelete(id);

    if (!deletedUser) {
        throw new ApiError(404, "User not found");
    }
    
    res.status(200).json(
        new ApiResponse(200, null, "User deleted successfully")
    );
});

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const foundUser = await user.findById(id)
        .select("-password -resetPasswordToken -verificationToken -verificationExpire -__v")
        .populate("purchasedPasses") // <--- Added: Shows pass details in single user view
        .lean();

    if (!foundUser) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(
        new ApiResponse(200, foundUser, "User details fetched successfully")
    );
});

export const getUsersByRole = asyncHandler(async (req, res) => {
    const { role } = req.params;

    const validRoles = ['student', 'gkvian', 'fetian', 'faculty'];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role specified");
    }

    const users = await user.find({ role })
        .select("-password -resetPasswordToken -verificationToken -verificationExpire -__v")
        .populate("purchasedPasses") // <--- Added
        .lean();

    res.status(200).json(
        new ApiResponse(200, users, `Users with role ${role} fetched successfully`)
    );
});

export const getUsersBySpecialRole = asyncHandler(async (req, res) => {
    const { specialRole } = req.params;
    
    const validSpecialRoles = ['event_coordinator', 'volunteer', 'category_lead', 'admin', 'finance_team', 'None'];
    if (!validSpecialRoles.includes(specialRole)) {
        throw new ApiError(400, "Invalid special role specified");
    }

    const users = await user.find({ specialRoles: specialRole })
        .select("-password -resetPasswordToken -verificationToken -verificationExpire -__v")
        .populate("purchasedPasses")
        .lean();

    res.status(200).json(
        new ApiResponse(200, users, `Users with special role ${specialRole} fetched successfully`)
    );
});

export const getUnverifiedUsers = asyncHandler(async (req, res) => {
    const users = await user.find({ isVerified: false })
        .select("-password -resetPasswordToken -verificationToken -verificationExpire -__v")
        .lean();

    res.status(200).json(
        new ApiResponse(200, users, "Unverified users fetched successfully")
    );
});

export const getUserUnverifiedPayments = asyncHandler(async (req, res) => {
  const users = await user
    .find({ paymentStatus: { $ne: "verified" } })
    .select("-password -resetPasswordToken -verificationToken -verificationExpire -__v")
    .populate("purchasedPasses")
    .lean();

  res.status(200).json(
    new ApiResponse(
      200,
      users,
      "Users with unverified payments fetched successfully"
    )
  );
});

export const verifyUserPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const foundUser = await user.findById(id);

    if (!foundUser) {
        throw new ApiError(404, "User not found");
    }
    
    if (foundUser.paymentStatus === "verified") {
        throw new ApiError(400, "User payment is already verified");
    }
    
    if (!foundUser.isVerified) {
        throw new ApiError(400, "User email is not verified. Cannot verify payment.");
    }

    foundUser.paymentStatus = "verified";
    await foundUser.save();

    try {
        await sendPaymentVerificationEmail(foundUser.email, foundUser.name, foundUser.jnanagniId);
    } catch (error) {
        console.error("Payment verification email failed:", error);
    }

    res.status(200).json(
        new ApiResponse(200, foundUser, "User payment verified successfully")
    );
});