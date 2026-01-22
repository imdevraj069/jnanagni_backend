import { Router } from "express";
import { markAttendance, markAbsent, getEventAttendanceStats } from "../controllers/attendance.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";
import { verifyEventStaffAccess } from "../middlewares/ownership.middleware.js";

const attendanceRouter = Router();

attendanceRouter.use(protect);

// 1. Mark Present
// POST /api/attendance/mark
// Body: { eventId, roundId, jnanagniId, force? }
attendanceRouter.post(
    "/mark",
    authorize("admin", "event_coordinator", "volunteer", "category_lead"),
    markAttendance
);

// 2. Mark Absent (Undo)
// POST /api/attendance/unmark
// Body: { eventId, roundId, jnanagniId }
attendanceRouter.post(
    "/unmark",
    authorize("admin", "event_coordinator"),
    markAbsent
);

// 3. View Stats for a round
// GET /api/attendance/stats/:eventId/:roundId
attendanceRouter.get(
    "/stats/:eventId/:roundId",
    authorize("admin", "event_coordinator", "category_lead"),
    getEventAttendanceStats
);

export default attendanceRouter;