import Report from "../models/Report.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

export const createReport = async (req, res) => {
  try {
    const { userId: clerkId } = req.auth();
    const { id: postId } = req.params;
    const { reason, description } = req.body;

    if (!clerkId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Prevent duplicate open reports for the same post by the same user
    const existing = await Report.findOne({
      post: post._id,
      reporter: user._id,
      status: "open",
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "You have already reported this listing. Thank you.",
        data: existing,
      });
    }

    const report = await Report.create({
      post: post._id,
      reporter: user._id,
      reason,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted. Our team will review it shortly.",
      data: report,
    });
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
