import express from "express";
import { getFeatures } from "../controllers/featuresController.js";
const router = express.Router();

router.get("/feature", getFeatures);
export default router;
