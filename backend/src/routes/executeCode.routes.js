import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { executeCode } from "../controllers/executeCode.controller";

const executionRoute = express.Router();


executionRoute.post("/", authMiddleware, executeCode)


export default executionRoute;
