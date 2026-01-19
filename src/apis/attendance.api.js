import { Router } from "express";
import { markAttendance, markAbsent, getEventAttendanceStats } from "../controllers/attendance.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";
import { verifyEventStaffAccess } from "../middlewares/ownership.middleware.js";

const attendanceRouter = Router();

attendanceRouter.use(protect);

// Helper to map body to params for middleware
const mapBodyToParams = (req, res, next) => {
    if (req.body.eventId) req.params.eventId = req.body.eventId;
    next();
};

// 1. Mark Present
attendanceRouter.post(
    "/mark",
    authorize("admin", "event_coordinator", "volunteer", "category_lead"),
    mapBodyToParams,
    verifyEventStaffAccess,
    markAttendance
);

// 2. Mark Absent (Undo)
attendanceRouter.post(
    "/unmark",
    authorize("admin", "event_coordinator"), // Usually restricted to Coords+
    mapBodyToParams,
    verifyEventStaffAccess,
    markAbsent
);

// 3. View Stats (For App Dashboard)
attendanceRouter.get(
    "/stats/:eventId",
    authorize("admin", "event_coordinator", "category_lead"),
    verifyEventStaffAccess,
    getEventAttendanceStats
);

export default attendanceRouter;