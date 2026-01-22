import { Certificate } from "../models/certificate.model.js";
import User from "../models/user.model.js";
import { Event } from "../models/event.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import crypto from "crypto";

// Helper to generate ID
export const generateUniqueCertificateId = async () => {
    let isUnique = false;
    let certificateId = "";
    while (!isUnique) {
        certificateId = `JGN26-CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const existing = await Certificate.findOne({ certificateId });
        if (!existing) isUnique = true;
    }
    return certificateId;
};

// ==========================================
// 1. REUSABLE HELPER (Use this in Attendance Controller)
// ==========================================
export const generateCertificateInternal = async ({ userId, eventId, registrationId, round }) => {
    // 1. Check if certificate already exists
    let certificate = await Certificate.findOne({ registration: registrationId });

    if (certificate) {
        // Update existing certificate with new round
        certificate.round = round;
        // Only update issuedAt if it's not generated yet
        if (!certificate.isGenerated) {
            certificate.issuedAt = new Date();
        }
        await certificate.save();
        return certificate;
    }

    // 2. Create New Certificate
    const newCertId = await generateUniqueCertificateId();
    
    certificate = await Certificate.create({
        user: userId,
        event: eventId,
        registration: registrationId,
        rank: null,
        teamName: null,
        type: "participation", // Default type
        round: round || "Check-In",
        certificateId: newCertId,
        isGenerated: false,
        issuedAt: new Date()
    });

    return certificate;
};

// ==========================================
// 2. PUBLIC API CONTROLLER (For manual triggering via API)
// ==========================================
export const createOrUpdateParticipationCertificate = asyncHandler(async (req, res) => {
    const { userId, eventId, registrationId, round } = req.body;

    // Validate existence
    const user = await User.findById(userId);
    const event = await Event.findById(eventId);
    if (!user || !event) throw new ApiError(404, "User or Event not found");

    // Call the internal helper
    const certificate = await generateCertificateInternal({ 
        userId, 
        eventId, 
        registrationId, 
        round 
    });

    res.status(200).json(
        new ApiResponse(200, certificate, "Certificate generated/updated successfully")
    );
});