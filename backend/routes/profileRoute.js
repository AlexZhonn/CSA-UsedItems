import express from "express";
import { getProfile } from "../controllers/profileController.js";
const router = express.Router();

router.post("/profile", getProfile);

export default router;
