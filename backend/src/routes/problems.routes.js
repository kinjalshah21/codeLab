import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";

const problemRoutes = express.Router();

problemRoutes.post("/create-problem", authMiddleware);

export default problemRoutes;