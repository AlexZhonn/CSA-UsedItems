import express from "express";
import {
  getAllPosts,
  addPost,
  deletePost,
  getUserActivePost,
  getUserInactivePost,
  getUserSoldPost,
  getSinglePost,
  getPostsByCategory,
  updatePost,
} from "../controllers/PostController.js";
import upload from "../middleware/upload.js";
import { requireAuth } from "@clerk/express";
import { createReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/", getAllPosts);
router.get("/post", getPostsByCategory);
router.post("/newpost/delete", deletePost);
router.get("/userpost/active", getUserActivePost);
router.get("/userpost/inactive", getUserInactivePost);
router.get("/userpost/sold", getUserSoldPost);

router.post("/:id/report", requireAuth(), createReport);
router.get("/:id", getSinglePost);
router.put("/:id", requireAuth(), upload.array("newImages", 5), updatePost);
export default router;
