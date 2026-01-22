import { Router } from "express";
import { 
    createRound,
    activateRound,
    getRounds,
    createResults,
    publishResults,
    unpublishResults,
    getAllResultsByEvent,
    getPublicResults,
    getResults,
    getQualifiedTeams,
    deleteRound,
    deleteResults
} from "../controllers/result.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";
import { verifyEventAuthority } from "../middlewares/ownership.middleware.js";

const resultRouter = Router();

// ==========================================
// 🌎 PUBLIC ROUTES
// ==========================================

// Get public results for a round
resultRouter.get("/:eventId/round/:roundId", getPublicResults);

// Get qualified teams for next round
resultRouter.get("/:eventId/round/:roundId/qualified", getQualifiedTeams);

// ==========================================
// 🔒 PROTECTED ADMIN ROUTES
// ==========================================
resultRouter.use(protect, authorize("admin", "category_lead", "event_coordinator", "faculty"));

// Round Management
resultRouter.post("/:eventId/rounds", verifyEventAuthority, createRound);
resultRouter.get("/:eventId/rounds", getRounds);
resultRouter.put("/:eventId/rounds/:roundId/activate", verifyEventAuthority, activateRound);
resultRouter.delete("/:eventId/rounds/:roundId", verifyEventAuthority, deleteRound);

// Result Management
resultRouter.post("/:eventId/round/:roundId", verifyEventAuthority, createResults);
resultRouter.put("/:eventId/round/:roundId/publish", verifyEventAuthority, publishResults);
resultRouter.put("/:eventId/round/:roundId/unpublish", verifyEventAuthority, unpublishResults);
resultRouter.get("/:eventId/round/:roundId/admin", verifyEventAuthority, getResults);
resultRouter.get("/:eventId/all-results", verifyEventAuthority, getAllResultsByEvent);
resultRouter.delete("/:eventId/round/:roundId", verifyEventAuthority, deleteResults);

export default resultRouter;