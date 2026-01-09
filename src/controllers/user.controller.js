import user from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// --- GET USER BY JNANAGNI ID (For Scanner) ---
export const getUserByJnanagniId = asyncHandler(async (req, res) => {
    const { jnanagniId } = req.params;

    if (!jnanagniId) {
        throw new ApiError(400, "Jnanagni ID is required");
    }

    const foundUser = await user.findOne({ jnanagniId }).select("-password -resetPasswordToken -__v");

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

    const foundUser = await user.findOne({ jnanagniId }).select("paymentStatus name email jnanagniId");

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
        .select("-password -resetPasswordToken -__v")
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit);

    // Get total count for frontend calculations
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
        // Ensure it's an array for validation loop
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

    const foundUser = await user.findById(id).select("-password -resetPasswordToken -__v");

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

    const users = await user.find({ role }).select("-password -resetPasswordToken -__v");

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

    const users = await user.find({ specialRoles: specialRole }).select("-password -resetPasswordToken -__v");

    res.status(200).json(
        new ApiResponse(200, users, `Users with special role ${specialRole} fetched successfully`)
    );
});

export const getUnverifiedUsers = asyncHandler(async (req, res) => {
    const users = await user.find({ isVerified: false }).select("-password -resetPasswordToken -__v");

    res.status(200).json(
        new ApiResponse(200, users, "Unverified users fetched successfully")
    );
});

export const getUserUnverifiedPayments = asyncHandler(async (req, res) => {
  const users = await user
    .find({ paymentStatus: { $ne: "verified" } })
    .select("-password -resetPasswordToken -__v");

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

    foundUser.paymentStatus = "verified";
    await foundUser.save();

    res.status(200).json(
        new ApiResponse(200, foundUser, "User payment verified successfully")
    );
});