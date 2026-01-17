import { Router } from "express";
import {
  createOrUpdatePass,
  getAllPasses,
  assignPassToUser,
  removePassFromUser,
  deletePass,
} from "../controllers/pass.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";

const passRouter = Router();

// Public: View available passes
passRouter.get("/", getAllPasses);

// Admin: Configure passes
passRouter.post(
  "/config",
  protect,
  authorize("admin", "finance_team"),
  createOrUpdatePass,
);

// Admin/Finance: Manually assign pass (or triggered by payment webhook)
passRouter.post(
  "/assign",
  protect,
  authorize("admin", "finance_team"),
  assignPassToUser,
);
passRouter.post(
    "/remove",
    protect,
    authorize("admin"),
    removePassFromUser
);

// Admin: Delete pass (removes from all users)
passRouter.delete(
    "/delete",
    protect,
    authorize("admin", "finance_team"),
    deletePass
);

export default passRouter;
