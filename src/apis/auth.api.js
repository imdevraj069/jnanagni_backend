import { Router } from "express";
import { 
    register, 
    login, 
    getMe, 
    forgotPassword, 
    resetPassword,
    verifyUserEmail,    // Imported
    resendVerification  // Imported
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

// Public Routes
authRouter.post("/register", register);
authRouter.post("/login", login);

// Verification Routes
authRouter.post("/verify-email", verifyUserEmail);       // Called by Frontend /verify page
authRouter.post("/resend-verification", resendVerification);

// Password Reset Routes
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

// Protected Routes
authRouter.get("/me", protect, getMe);

authRouter.get("/", (req, res) => {
    res.status(200).json({ message: "Auth API is working." });
});