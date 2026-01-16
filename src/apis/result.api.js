import { Router } from "express";
import { 
    publishResults, 
    getPublicResults, 
    getAdminResults,
    toggleResultVisibility,
    deleteResults 
} from "../controllers/result.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";
import { verifyEventAuthority } from "../middlewares/ownership.middleware.js";

const resultRouter = Router();

// ==========================================
// 🌎 PUBLIC ROUTE
// ==========================================
// Only returns if published: true
resultRouter.get("/:eventId", getPublicResults);


// ==========================================
// 🔒 PROTECTED MANAGEMENT ROUTES
// ==========================================

// 1. Get All Results (Drafts + Live) - For Dashboard
resultRouter.get(
    "/admin/:eventId", 
    protect, 
    authorize("admin", "category_lead", "event_coordinator"),
    verifyEventAuthority, 
    getAdminResults
);

// 2. Publish/Save Results (Upsert)
resultRouter.post(
    "/:eventId", 
    protect, 
    authorize("admin", "category_lead", "event_coordinator"),
    verifyEventAuthority, 
    publishResults
);

// 3. Quick Toggle (Live <-> Draft)
// PUT /api/v1/results/:eventId/status
// Body: { "publish": true }
resultRouter.put(
    "/:eventId/status",
    protect, 
    authorize("admin", "category_lead", "event_coordinator"),
    verifyEventAuthority, 
    toggleResultVisibility
);

// 4. Delete
resultRouter.delete(
    "/:eventId", 
    protect, 
    authorize("admin", "category_lead"),
    verifyEventAuthority,
    deleteResults
);

export default resultRouter;