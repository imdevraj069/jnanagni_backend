import {
    createQuery,
    getAllQueries,
    getQueryById,
    deleteQueryById,
    markQueryAsResolved
} from "../controllers/querry.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/access.middleware.js";

import {Router} from "express";

const querryRouter = Router();

// Public Routes
querryRouter.post('/create', createQuery);

// Protected Routes (Admin Only)
querryRouter.use(protect);
querryRouter.use(authorize('admin'));

querryRouter.get('/', getAllQueries);
querryRouter.get('/q/:id', getQueryById);
querryRouter.delete('/q/:id', deleteQueryById);
querryRouter.patch('/q/:id/resolve', markQueryAsResolved);

export default querryRouter;

