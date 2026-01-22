import { Certificate } from "../models/certificate.model.js";
import User from "../models/user.model.js";
import { Event } from "../models/event.model.js";
import { Registration } from "../models/registration.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import crypto from "crypto";

// Helper to generate unique certificate ID
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
// GET ALL CERTIFICATES FOR A USER
// ==========================================
export const getUserCertificates = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const certs = await Certificate.find({ user: userId })
        .populate("event", "name date")
        .populate("registration", "teamName");

    res.status(200).json(
        new ApiResponse(200, certs, "Certificates fetched")
    );
});

// ==========================================
// GET FINAL WINNERS (Top 3 certificates)
// ==========================================
export const getFinalWinners = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const winners = await Certificate.find({
        event: eventId,
        isWinner: true
    })
    .sort({ winnerRank: 1 })
    .populate("registration", "teamName registeredBy")
    .populate("registeredBy", "name email");

    res.status(200).json(
        new ApiResponse(200, winners, "Winners fetched")
    );
});

// ==========================================
// GET CERTIFICATE BY ID
// ==========================================
export const getCertificateById = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({ certificateId })
        .populate("event", "name date")
        .populate("registration", "teamName")
        .populate("user", "name email jnanagniId");

    if (!cert) {
        throw new ApiError(404, "Certificate not found");
    }

    res.status(200).json(
        new ApiResponse(200, cert, "Certificate fetched")
    );
});