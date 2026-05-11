import Post from "../models/Post.js";
import User from "../models/User.js";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";
import mongoose from "mongoose";
export async function getAllPosts(req, res) {
  try {
    const posts = await Post.find({ status: "active" }).lean();

    const postsWithUser = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findOne({ clerkId: post.clerkId }).lean();

        return {
          ...post,
          seller: user
            ? {
                firstName: user.firstName,
                lastName: user.lastName,
                avatar:
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
                clerkId: user.clerkId,
                verified: user.verified || false,
              }
            : null,
        };
      })
    );

    res.status(200).json(postsWithUser);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ msg: err.message });
  }
}

export async function addPost(req, res) {
  try {
    const {
      clerkId,
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
      !clerkId ||
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

    // Upload images to S3
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

export async function deletePost(req, res) {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.body.postId);
    if (!deletedPost) {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
}

export async function getUserActivePost(req, res) {
  try {
    const clerkId = req.query.clerkId;
    if (!clerkId) {
      return;
    }
    const post = await Post.find({ clerkId: clerkId, status: "active" });
    res.status(202).json(post);
  } catch (err) {
    console.log(err);
  }
}

export async function getUserSoldPost(req, res) {
  try {
    const clerkId = req.query.clerkId;
    if (!clerkId) {
      return;
    }
    const post = await Post.find({ clerkId: clerkId, status: "sold" });
    res.status(202).json(post);
  } catch (err) {
    console.log(err);
  }
}

export async function getUserInactivePost(req, res) {
  try {
    const clerkId = req.query.clerkId;
    if (!clerkId) {
      return;
    }
    const post = await Post.find({ clerkId: clerkId, status: "inactive" });
    res.status(202).json(post);
  } catch (err) {
    console.log(err);
  }
}

export async function getSinglePost(req, res) {
  const { id } = req.params;

  try {
    const post = await Post.findById(id).lean();
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const user = await User.findOne({ clerkId: post.clerkId }).lean();

    const postWithSeller = {
      ...post,
      seller: user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            avatar:
              user.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
            bio: user.description || "",
            clerkId: user.clerkId,
          }
        : {
            firstName: "Unknown",
            lastName: "",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown`,
            clerkId: post.clerkId,
          },
    };

    await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.status(200).json(postWithSeller);
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export const getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: "Missing category" });
    }

    // 找出该类别的帖子
    const posts = await Post.find({ category }).lean();

    // 🔧 手动补 seller 信息（不要 populate）
    const postsWithSeller = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findOne({ clerkId: post.clerkId }).lean();

        return {
          ...post,
          seller: user
            ? {
                firstName: user.firstName,
                lastName: user.lastName,
                avatar:
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
                clerkId: user.clerkId,
              }
            : null,
        };
      })
    );

    res.status(200).json(postsWithSeller);
  } catch (error) {
    console.error("Error fetching related posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // Clerk auth is applied at the route level (requireAuth) so req.auth() is available
    const auth = req.auth();
    const clerkId = auth?.userId;

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

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // If we have an authenticated user, enforce ownership
    if (clerkId && post.clerkId !== clerkId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Parse arrays from form-data (they are sent as JSON strings)
    let existing = [];
    let toDelete = [];

    try {
      if (existingImages) {
        const parsed = JSON.parse(existingImages);
        if (Array.isArray(parsed)) existing = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse existingImages", e);
    }

    try {
      if (imagesToDelete) {
        const parsed = JSON.parse(imagesToDelete);
        if (Array.isArray(parsed)) toDelete = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse imagesToDelete", e);
    }

    // Delete images from S3 that are marked for removal
    if (toDelete.length > 0) {
      const deletePromises = toDelete.map((imageUrl) => deleteFromS3(imageUrl));
      await Promise.all(deletePromises);
    }

    // Keep only images that are NOT deleted
    const keptExisting = existing.filter((url) => !toDelete.includes(url));

    // Upload any newly added images
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToS3(file));
      newImageUrls = await Promise.all(uploadPromises);
    }

    // Update core fields
    if (typeof title === "string") post.title = title;
    if (typeof description === "string") post.description = description;
    if (price !== undefined) post.price = parseFloat(price);
    if (typeof category === "string") post.category = category;
    if (typeof condition === "string") post.condition = condition;
    if (typeof location === "string") post.location = location;
    if (typeof meetingPreference === "string") {
      post.meetingPreference = meetingPreference;
    }

    // Final image list
    post.images = [...keptExisting, ...newImageUrls];

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
