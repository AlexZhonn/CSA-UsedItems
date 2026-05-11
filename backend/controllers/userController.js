import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";
import { isImageSafe } from "../utils/geminiModeration.js";
import { v4 as uuidv4 } from "uuid";
export const saveUser = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const { firstName, lastName, email, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const isUflEmail = email.toLowerCase().trim().endsWith("@ufl.edu");

    // find a user
    let user = await User.findOne({ clerkId });

    // if the user does not exist, create a new one using create method.
    if (!user) {
      user = await User.create({
        clerkId,
        firstName,
        lastName,
        PhoneNumber: "",
        email,
        avatar: avatar,
        // Optionally mark UF emails as verified for UI purposes
        verified: isUflEmail,
      });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error saving user", error: err.message });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth(); // Clerk 自动解析
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};

export const updateUserFavorite = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    if (!clerkId)
      return res.status(400).json({ message: "clerkId is required" });

    const { postId, action } = req.body;
    if (!postId) return res.status(400).json({ message: "postId is required" });

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === "add") {
      await User.updateOne({ clerkId }, { $addToSet: { favorites: postId } });
      await Post.findByIdAndUpdate(postId, { $inc: { favorites: 1 } });
    } else if (action === "remove") {
      await User.updateOne({ clerkId }, { $pull: { favorites: postId } });
      await Post.findByIdAndUpdate(postId, { $inc: { favorites: -1 } });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    const updatedUser = await User.findOne({ clerkId }).populate("favorites");
    res.status(200).json(updatedUser);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserFavorite = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    if (!clerkId)
      return res.status(400).json({ message: "clerkId is required" });

    const user = await User.findOne({ clerkId }).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.favorites);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const addUserActive = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }
    const { postId } = req.body;
    console.log(postId);
    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await User.updateOne({ clerkId }, { $addToSet: { active: postId } });
    const updatedUser = await User.findOne({ clerkId }).populate("active");
    res.status(200).json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};

// converstaions and messages

export const getUserConversations = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    const { postId } = req.query;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = { participants: user._id };
    if (postId) {
      match.post = postId;
    }

    const conversations = await Conversation.find(match)
      .populate("participants", "firstName lastName email avatar clerkId")
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
    const { userId: clerkId } = req.auth();
    const conversationId = req.params.id;

    const user = await User.findOne({ clerkId });
    const conversation = await Conversation.findById(conversationId);
    console.log(conversation);

    if (!conversation.participants.includes(user._id))
      return res.status(403).json({ message: "Not authorized" });

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName email")
      .sort({ sentAt: 1 });

    console.log(messages);

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startConversation = async (req, res) => {
  try {
    const { userId: buyerClerkId } = req.auth(); // user him/herself

    const { postId } = req.body; // seller
    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const buyer = await User.findOne({ clerkId: buyerClerkId });
    if (
      !buyer ||
      !buyer.email ||
      !buyer.email.toLowerCase().trim().endsWith("@ufl.edu")
    ) {
      return res.status(403).json({
        message:
          "Only University of Florida (@ufl.edu) accounts can contact sellers on Gator Exchange.",
      });
    }

    const post = await Post.findById(postId).populate("clerkId");
    if (!post) {
      return res.status(404).json({ message: "Buyer or post not found" });
    }
    const seller = await User.findOne({ clerkId: post.clerkId });
    if (!seller) {
      return res
        .status(404)
        .json({ message: "Seller not found for this post" });
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
    const { userId: clerkId } = req.auth();

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Look up the Mongo user and enforce UF email domain for posting
    const user = await User.findOne({ clerkId });
    if (
      !user ||
      !user.email ||
      !user.email.toLowerCase().trim().endsWith("@ufl.edu")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only University of Florida (@ufl.edu) accounts can create listings on Gator Exchange.",
      });
    }

    const {
      title,
      description,
      price,
      category,
      condition,
      location,
      meetingPreference,
      firstName,
      lastName,
    } = req.body;
    // Validate required fields
    if (
      !title ||
      !description ||
      !price ||
      !category ||
      !condition ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
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

    // If all images are safe, upload them to S3
    const imageUploadPromises = req.files.map((file) => uploadToS3(file));
    const imageUrls = await Promise.all(imageUploadPromises);

    // Create new post
    const newPost = new Post({
      clerkId,
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      location,
      meetingPreference: meetingPreference || "campus",
      images: imageUrls,
      status: "active",
      firstName: firstName,
      lastName: lastName,
    });

    await newPost.save();
    console.log("New post created:", newPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message,
    });
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const clerkId = req.params.id || req.auth()?.userId;
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSelf = !req.params.id;
    const safeUser = isSelf
      ? user
      : {
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          description: user.description,
          location: user.location,
          createdAt: user.createdAt,
          email: user.email,
        };

    res.status(200).json(safeUser);
  } catch (err) {
    console.error("Error fetching user:", err);
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};

export const getUserActive = async (req, res) => {
  try {
    const clerkId = req.params.id || req.auth()?.userId;
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const user = await User.findOne({ clerkId }).populate("active");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.active || []);
  } catch (err) {
    console.error("Error fetching active posts:", err);
    res
      .status(500)
      .json({ message: "Error fetching active posts", error: err.message });
  }
};

export const getUserSoldPost = async (req, res) => {
  try {
    const clerkId = req.params.id || req.auth()?.userId;
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const user = await User.findOne({ clerkId }).populate("sold");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.sold || []);
  } catch (err) {
    console.error("Error fetching sold posts:", err);
    res
      .status(500)
      .json({ message: "Error fetching sold posts", error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const clerkId = req.auth().userId;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.clerkId !== clerkId) {
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

    // Clean up references to this post from the owner's document
    await User.updateOne(
      { clerkId },
      {
        $pull: {
          active: id,
          sold: id,
          favorites: id,
        },
      }
    );

    // Also remove this post from any other users' favorites, if present
    await User.updateMany(
      { favorites: id },
      { $pull: { favorites: id } }
    );

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const activeToSold = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId: clerkId } = req.auth();
    const { status = "sold" } = req.body || {};

    let user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ensure the authenticated user owns this post
    if (post.clerkId !== clerkId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (status === "active") {
      // Mark as unsold / back to active
      post.status = "active";
      await post.save();

      // Remove from sold array
      user.sold = user.sold.filter((id) => id.toString() !== postId.toString());

      // Ensure it exists in active array
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

    // Default path – mark as sold
    post.status = "sold";
    await post.save();

    user.active = user.active.filter(
      (id) => id.toString() !== postId.toString()
    );

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
    const { clerkId } = req.auth();
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const { itemId } = req.params;
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

    // Find the post
    const post = await Post.findById(itemId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Verify ownership
    if (post.clerkId !== req.user.clerkId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Delete images from S3 if specified
    if (imagesToDelete && imagesToDelete.length > 0) {
      const deletePromises = JSON.parse(imagesToDelete).map((imageUrl) =>
        deleteFromS3(imageUrl)
      );
      await Promise.all(deletePromises);
    }

    // Upload new images
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToS3(file));
      newImageUrls = await Promise.all(uploadPromises);
    }

    // Combine existing and new images
    const finalImages = [
      ...JSON.parse(existingImages || "[]"),
      ...newImageUrls,
    ];

    // Update post
    post.title = title;
    post.description = description;
    post.price = parseFloat(price);
    post.category = category;
    post.condition = condition;
    post.location = location;
    post.meetingPreference = meetingPreference;
    post.images = finalImages;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error("Update Post Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: error.message,
    });
  }
};

export const getReviews = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    const user = await User.findOne({ clerkId }).populate("reviews");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.reviews || []);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth(); // Get the current user's Clerk ID
    const { content, conversationId } = req.body; // Message content and conversation ID from frontend

    // 1. Validate message content
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // 2. Find sender user in the database
    const senderUser = await User.findOne({ clerkId });
    if (!senderUser) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Enforce UF email domain for sending messages
    if (
      !senderUser.email ||
      !senderUser.email.toLowerCase().trim().endsWith("@ufl.edu")
    ) {
      return res.status(403).json({
        message:
          "Only University of Florida (@ufl.edu) accounts can send messages on Gator Exchange.",
      });
    }

    // 3. Find the conversation by ID
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 4. Check if the sender is part of the conversation
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderUser._id.toString()
    );
    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "Not authorized to send messages" });
    }

    // 5. Find the receiver (the other participant in the conversation)
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== senderUser._id.toString()
    );

    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // 6. Create a new message document
    const newMessage = new Message({
      messageId: uuidv4(), // Unique message ID
      conversationId: conversation._id, // Link message to conversation
      sender: senderUser._id, // Sender's database ID
      receiver: receiverUser._id, // Receiver's database ID
      message: content, // Message text
      check: false, // Unread by default
      timestamp: new Date(), // Creation time
    });

    await newMessage.save();

    // 7. Update the conversation with the last message info
    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // 8. Send success response back to client
    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth(); // Clerk ID from JWT
    const user = await User.findOne({ clerkId }); // Find matching user in MongoDB

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user document (includes Mongo _id)
    res.status(200).json(user);
  } catch (err) {
    console.error("Error in getMe:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const { firstName, lastName, bio, location, phone, avatar } = req.body;

    const user = await User.findOne({ clerkId });
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
