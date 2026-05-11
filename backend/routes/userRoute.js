import express from "express";
import {
  saveUser,
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
} from "../controllers/userController.js";
import upload from "../middleware/upload.js";
import { updatePost } from "../controllers/userController.js";
const router = express.Router();
// save profile
router.post("/save", saveUser);
router.get("/profile", getUserProfile);
router.put("/profile", updateUser);

router.get("/profile/:id", getUserProfile);
router.get("/post/active/:id", getUserActive);
router.get("/post/sold/:id", getUserSoldPost);

router.get("/me", getMe)

// favorites
router.post("/post/favorites", updateUserFavorite); //add new favorites to user account.
router.get("/post/favorites", getUserFavorite); //get user favorites
router.get("/post/active", getUserActive); //get user active posts
router.post("/post/active", addUserActive); //add active post(when they upload new post) to user account.
router.get("/post/sold", getUserSoldPost); //get user sold posts

// conversations
router.get("/conversation", getUserConversations);
router.post("/conversation/start", startConversation);

//messages
router.get("/conversation/:id/messages", getUserMessages);
router.post("/conversation/:id/messages", sendMessage);

//add post (requireAuth)
router.post("/post/add", upload.array("images", 5), addPost);

//modify post
router.put("/:id", updatePost);

//delete post
router.delete("/post/:id", deletePost);

//active post to sold
router.patch("/post/:id", activeToSold);

//get users reviews
router.get("/reviews", getReviews);

export default router;
