import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getChatAccessStatus, getStreamToken } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.get("/access/:id", protectRoute, getChatAccessStatus);

export default router;