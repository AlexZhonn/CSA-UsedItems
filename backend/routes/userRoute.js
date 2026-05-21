import express from "express";
import {
  getUserProfile,
  updateUserFavorite,
  getUserFavorite,
  getUserActive,
  addUserActive,
  getUserSoldPost,
  getUserConversations,
  startConversation,
  addPost,
  deletePost,
  activeToSold,
  getReviews,
  getUserMessages,
  sendMessage,
  getMe,
  updateUser,
  updatePost,
} from "../controllers/userController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// profile
router.get("/profile", getUserProfile);
router.put("/profile", updateUser);
router.get("/profile/:id", getUserProfile);

router.get("/me", getMe);

// active / sold listings
router.get("/post/active/:id", getUserActive);
router.get("/post/sold/:id", getUserSoldPost);

// favorites
router.post("/post/favorites", updateUserFavorite);
router.get("/post/favorites", getUserFavorite);
router.get("/post/active", getUserActive);
router.post("/post/active", addUserActive);
router.get("/post/sold", getUserSoldPost);

// conversations
router.get("/conversation", getUserConversations);
router.post("/conversation/start", startConversation);

// messages
router.get("/conversation/:id/messages", getUserMessages);
router.post("/conversation/:id/messages", sendMessage);

// post CRUD
router.post("/post/add", upload.array("images", 5), addPost);
router.put("/:id", upload.array("images", 5), updatePost);
router.delete("/post/:id", deletePost);
router.patch("/post/:id", activeToSold);

// reviews
router.get("/reviews", getReviews);

export default router;
