import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";
import { v4 as uuidv4 } from "uuid";

export const updateUserFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId, action } = req.body;
    if (!postId) return res.status(400).json({ message: "postId is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === "add") {
      await User.findByIdAndUpdate(userId, { $addToSet: { favorites: postId } });
      await Post.findByIdAndUpdate(postId, { $inc: { favorites: 1 } });
    } else if (action === "remove") {
      await User.findByIdAndUpdate(userId, { $pull: { favorites: postId } });
      await Post.findByIdAndUpdate(postId, { $inc: { favorites: -1 } });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    const updatedUser = await User.findById(userId).populate("favorites");
    res.status(200).json(updatedUser);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user.favorites);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const addUserActive = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await User.findByIdAndUpdate(userId, { $addToSet: { active: postId } });
    const updatedUser = await User.findById(userId).populate("active");
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.query;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = { participants: user._id };
    if (postId) {
      match.post = postId;
    }

    const conversations = await Conversation.find(match)
      .populate("participants", "firstName lastName email avatar _id")
      .populate("lastMessage")
      .populate("post", "title price images")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const conversationId = req.params.id;

    const user = await User.findById(userId);
    const conversation = await Conversation.findById(conversationId);

    if (!conversation.participants.includes(user._id))
      return res.status(403).json({ message: "Not authorized" });

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName email")
      .sort({ sentAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startConversation = async (req, res) => {
  try {
    const buyerId = req.userId;
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const seller = await User.findById(post.userId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found for this post" });
    }

    if (buyer._id.equals(seller._id)) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [buyer._id, seller._id] },
      post: postId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [buyer._id, seller._id],
        post: postId || null,
      });
    }

    res.status(200).json({
      message: "Conversation ready",
      conversationId: conversation._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export async function addPost(req, res) {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const {
      title,
      description,
      price,
      category,
      condition,
      location,
      meetingPreference,
    } = req.body;

    if (!title || !description || !price || !category || !condition || !location) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    // Run Gemini safety check on each image BEFORE uploading to S3
    // for (const file of req.files) {
    //   try {
    //     const safe = await isImageSafe(file);
    //     if (!safe) {
    //       return res.status(400).json({
    //         success: false,
    //         message:
    //           "One of your images appears to violate our content policy. " +
    //           "Please choose a different photo.",
    //       });
    //     }
    //   } catch (err) {
    //     console.error("Gemini moderation error:", err);
    //     return res.status(502).json({
    //       success: false,
    //       message:
    //         "We had an issue checking your image. Please try again in a moment.",
    //     });
    //   }
    // }

    const imageUploadPromises = req.files.map((file) => uploadToS3(file));
    const imageUrls = await Promise.all(imageUploadPromises);

    const newPost = new Post({
      userId,
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      location,
      meetingPreference: meetingPreference || "campus",
      images: imageUrls,
      status: "active",
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await newPost.save();

    // Add post to user's active array
    await User.findByIdAndUpdate(userId, { $addToSet: { active: newPost._id } });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ success: false, message: "Failed to create post", error: error.message });
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // When id param is present, treat as a userId (Mongo ObjectId)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSelf = !req.params.id;
    const safeUser = isSelf
      ? user
      : {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          description: user.description,
          location: user.location,
          createdAt: user.createdAt,
          email: user.email,
          rating: user.rating,
        };

    res.status(200).json(safeUser);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};

export const getUserActive = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId).populate("active");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.active || []);
  } catch (err) {
    console.error("Error fetching active posts:", err);
    res.status(500).json({ message: "Error fetching active posts", error: err.message });
  }
};

export const getUserSoldPost = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId).populate("sold");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.sold || []);
  } catch (err) {
    console.error("Error fetching sold posts:", err);
    res.status(500).json({ message: "Error fetching sold posts", error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (post.images && post.images.length > 0) {
      for (const imageUrl of post.images) {
        try {
          await deleteFromS3(imageUrl);
        } catch (err) {
          console.warn("Failed to delete image from S3:", imageUrl);
        }
      }
    }

    await Post.findByIdAndDelete(id);

    await User.findByIdAndUpdate(userId, {
      $pull: { active: id, sold: id, favorites: id },
    });

    await User.updateMany({ favorites: id }, { $pull: { favorites: id } });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const activeToSold = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;
    const { status = "sold" } = req.body || {};

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (status === "active") {
      post.status = "active";
      await post.save();

      user.sold = user.sold.filter((id) => id.toString() !== postId.toString());
      if (!user.active.some((id) => id.toString() === postId.toString())) {
        user.active.push(postId);
      }
      await user.save();

      return res.status(200).json({
        message: "Post marked as active",
        updatedActive: user.active,
        updatedSold: user.sold,
      });
    }

    post.status = "sold";
    await post.save();

    user.active = user.active.filter((id) => id.toString() !== postId.toString());
    if (!user.sold.includes(postId)) {
      user.sold.push(postId);
    }
    await user.save();

    res.status(200).json({
      message: "Post marked as sold",
      updatedActive: user.active,
      updatedSold: user.sold,
    });
  } catch (err) {
    console.error("Error updating post status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const userId = req.userId;
    const itemId = req.params.id;

    const {
      title,
      description,
      price,
      category,
      condition,
      location,
      meetingPreference,
      existingImages,
      imagesToDelete,
    } = req.body;

    const post = await Post.findById(itemId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (imagesToDelete && imagesToDelete.length > 0) {
      const deletePromises = JSON.parse(imagesToDelete).map((imageUrl) =>
        deleteFromS3(imageUrl)
      );
      await Promise.all(deletePromises);
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToS3(file));
      newImageUrls = await Promise.all(uploadPromises);
    }

    const finalImages = [
      ...JSON.parse(existingImages || "[]"),
      ...newImageUrls,
    ];

    post.title = title;
    post.description = description;
    post.price = parseFloat(price);
    post.category = category;
    post.condition = condition;
    post.location = location;
    post.meetingPreference = meetingPreference;
    post.images = finalImages;

    await post.save();

    res.status(200).json({ success: true, message: "Post updated successfully", data: post });
  } catch (error) {
    console.error("Update Post Error:", error);
    res.status(500).json({ success: false, message: "Failed to update post", error: error.message });
  }
};

export const getReviews = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate("reviews");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.reviews || []);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { content, conversationId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const senderUser = await User.findById(senderId);
    if (!senderUser) {
      return res.status(404).json({ message: "Sender not found" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderUser._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to send messages" });
    }

    const receiverId = conversation.participants.find(
      (p) => p.toString() !== senderUser._id.toString()
    );

    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const newMessage = new Message({
      messageId: uuidv4(),
      conversationId: conversation._id,
      sender: senderUser._id,
      receiver: receiverUser._id,
      message: content,
      check: false,
      timestamp: new Date(),
    });

    await newMessage.save();

    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error in getMe:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const savePublicKey = async (req, res) => {
  try {
    const userId = req.userId;
    const { publicKey } = req.body;
    if (!publicKey || typeof publicKey !== "string") {
      return res.status(400).json({ message: "publicKey is required" });
    }
    await User.findByIdAndUpdate(userId, { publicKey });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("publicKey");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ publicKey: user.publicKey || "" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.userId;

    const { firstName, lastName, bio, location, phone, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof firstName === "string" && firstName.trim()) {
      user.firstName = firstName.trim();
    }
    if (typeof lastName === "string" && lastName.trim()) {
      user.lastName = lastName.trim();
    }
    if (typeof bio === "string") {
      user.description = bio;
    }
    if (typeof location === "string") {
      user.location = location;
    }
    if (typeof phone === "string") {
      user.PhoneNumber = phone;
    }
    if (typeof avatar === "string" && avatar.trim()) {
      user.avatar = avatar.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user profile",
      error: err.message,
    });
  }
};
