import crypto from 'crypto';
import user from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendWelcomeEmail, sendOtpEmail, sendVerificationEmail } from "../services/email.service.js";

const generateJnanagniId = () => {
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase(); 
  return `JGN26-${suffix}`;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, contactNo, whatsappNo, college, branch, campus, role, adminSecret } = req.body;
  
  const existingUser = await user.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  // ID Generation
  let uniqueId;
  let isUnique = false;
  while (!isUnique) {
    uniqueId = generateJnanagniId();
    const existingIdUser = await user.findOne({ jnanagniId: uniqueId });
    if (!existingIdUser) isUnique = true; 
  }

  let userRole = (role || "student").toLowerCase(); 

  // 2. Determine Special Roles
  // Default to ["None"]
  let specialRoles = ["None"];

  // Check Admin Secret
  if (adminSecret === process.env.ADMIN_SECRET) {
    // If secret matches, set special role to admin
    // We replace "None" with "admin"
    specialRoles = ["admin"]; 
  }

  // Create User
  const newUser = new user({ 
    name, 
    email, 
    password, 
    contactNo, 
    whatsappNo, 
    college, 
    branch, 
    campus,
    role: userRole,         // Primary Role (e.g., student)
    specialRoles: specialRoles, // Special Role (e.g., admin or None)
    jnanagniId: uniqueId,
  });

  // Generate Verification Token
  const verificationToken = newUser.generateVerificationToken();
  await newUser.save();

  // Send Verification Email
  try {
    await sendVerificationEmail(email, name, uniqueId, verificationToken);
  } catch (error) {
    console.error("Email failed:", error);
    // delete user if email fails
    await user.deleteOne({ _id: newUser._id });
    throw new ApiError(500, "Failed to send verification email. Please try again.");
  }

  res.status(201).json(
    new ApiResponse(201, { jnanagniId: uniqueId }, "Registration successful. Please check your email to verify account.")
  );
});

// --- VERIFY EMAIL (Step 2) ---
export const verifyUserEmail = asyncHandler(async (req, res) => {
  const { jnanagniId, token } = req.body; // Sent from frontend

  if (!jnanagniId || !token) {
    throw new ApiError(400, "Invalid verification link");
  }

  // Hash token to compare with DB
  // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const userRecord = await user.findOne({
    jnanagniId,
    verificationToken: token,
    verificationExpire: { $gt: Date.now() } // Check expiry
  });

  if (!userRecord) {
    throw new ApiError(400, "Invalid or expired verification link. Please resend verification.");
  }

  // Activate User
  userRecord.isVerified = true;
  userRecord.verificationToken = undefined;
  userRecord.verificationExpire = undefined;
  await userRecord.save();

  // Send Welcome Email (Now that they are verified)
  try {
    await sendWelcomeEmail(userRecord.email, userRecord.name, userRecord.jnanagniId);
  } catch (error) {
    console.error("Welcome email failed:", error);
  }

  // Generate Token for immediate login
  const authToken = userRecord.getAccessToken();

  res.status(200).json(
    new ApiResponse(200, { user: userRecord, token: authToken }, "Email verified successfully!")
  );
});

// --- RESEND VERIFICATION ---
export const resendVerification = asyncHandler(async (req, res) => {
  const { email, jnanagniId } = req.body;
  
  // Find by either email or ID
  const query = email ? { email } : { jnanagniId };
  const userRecord = await user.findOne(query);

  if (!userRecord) throw new ApiError(404, "User not found");
  if (userRecord.isVerified) throw new ApiError(400, "User already verified");

  const newToken = 
  // check if existing token is not expired send that token and reset time of expiry for 10 mins
  (userRecord.verificationExpire && userRecord.verificationExpire > Date.now()) 
    ? userRecord.verificationToken 
    : userRecord.generateVerificationToken();
  userRecord.verificationExpire = Date.now() + 30 * 60 * 1000; // 30 mins from now
  await userRecord.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail(userRecord.email, userRecord.name, userRecord.jnanagniId, newToken);
  } catch (error) {
    throw new ApiError(500, "Failed to send email");
  }

  res.status(200).json(
    new ApiResponse(200, {}, "Verification link resent successfully")
  );
});

// --- LOGIN ---
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide an email and password");
  }

  const foundUser = await user.findOne({ email });

  if (!foundUser) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await foundUser.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!foundUser.isVerified) {
    // Instead of a plain error, we send a 403 with the user's email in the payload
    return res.status(403).json({
      success: false,
      message: "Email not verified. Please check your inbox.",
      data: {
        email: foundUser.email,
        isVerified: false
      }
    });
  }

  const token = foundUser.getAccessToken();
  const loggedInUser = await user.findById(foundUser._id).select("-password");

  res.status(200).json(
    new ApiResponse(200, { user: loggedInUser, token }, "User logged in successfully")
  );
});

// --- GET CURRENT USER (ME) ---
export const getMe = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  res.status(200).json(
    new ApiResponse(200, { user: currentUser }, "User profile fetched successfully")
  );
});


// --- FORGOT PASSWORD ---
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const userRecord = await user.findOne({ email });
  if (!userRecord) {
    throw new ApiError(404, "User not found");
  }

  const otp = userRecord.generateResetOtp();
  await userRecord.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(email, otp);
    res.status(200).json(
      new ApiResponse(200, {}, `Verification code sent to ${email}`)
    );
  } catch (err) {
    userRecord.resetPasswordToken = undefined;
    userRecord.resetPasswordExpire = undefined;
    await userRecord.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send verification email");
  }
});

// --- RESET PASSWORD ---
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    throw new ApiError(400, "Email, OTP, and new password are required");
  }

  const hashedOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  const userRecord = await user.findOne({
    email,
    resetPasswordToken: hashedOtp,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!userRecord) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  userRecord.password = password;
  userRecord.resetPasswordToken = undefined;
  userRecord.resetPasswordExpire = undefined;
  
  await userRecord.save();

  res.status(200).json(
    new ApiResponse(200, {}, "Password reset successfully. You can now login.")
  );
});