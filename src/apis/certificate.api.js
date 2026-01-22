import { Router } from "express";
import {
    generateUniqueCertificateId,
    getUserCertificates,
    getFinalWinners,
    getCertificateById,
    getCertificatesByEvent,
    getWinnerCertificatesByEvent,
    getParticipationCertificatesByEvent,
    getCompletionCertificatesByEvent
} from "../controllers/certificate.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const certificateRouter = Router();

// ==========================================
// 🌎 PUBLIC ROUTES
// ==========================================

// Get certificate by certificate ID
certificateRouter.get("/certificate/:certificateId", getCertificateById);

// Get final winners for an event
certificateRouter.get("/event/:eventId/winners", getFinalWinners);

// Get all certificates for an event
certificateRouter.get("/event/:eventId/all", getCertificatesByEvent);

// Get winner certificates for an event
certificateRouter.get("/event/:eventId/winners-certificates", getWinnerCertificatesByEvent);

// Get participation certificates for an event
certificateRouter.get("/event/:eventId/participation", getParticipationCertificatesByEvent);

// Get completion certificates for an event
certificateRouter.get("/event/:eventId/completion", getCompletionCertificatesByEvent);

// ==========================================
// 🔒 PROTECTED ROUTES
// ==========================================
certificateRouter.use(protect);

// Get all certificates for a user
certificateRouter.get("/user/:userId", getUserCertificates);

export default certificateRouter;
