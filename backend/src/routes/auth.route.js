import express from 'express';
import {login, signup,onboard, logout} from '../controllers/auth.controller.js';
import {protectRoute} from '../middleware/auth.middleware.js';

const router = express.Router();


    

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
    
router.post("/onboarding", protectRoute, onboard);

import jwt from "jsonwebtoken";
import User from "../models/User.js";

router.get("/me", async (req, res) => {
    try {
        const token = req.cookies.jwt;
        if (!token) return res.status(200).json({ success: false, user: null });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) return res.status(200).json({ success: false, user: null });
        
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(200).json({ success: false, user: null });
        
        res.status(200).json({ success: true, user });
    } catch (error) {
        // If token is invalid/expired, still return 200 to avoid console error
        res.status(200).json({ success: false, user: null });
    }
});
export default router;