import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Textbooks",
        "Furniture",
        "Electronics",
        "Clothing",
        "Sports & Outdoors",
        "Gaming",
        "Home & Kitchen",
        "Other",
      ],
    },
    condition: {
      type: String,
      required: true,
      enum: ["Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"],
    },
    location: {
      type: String,
      required: true,
    },
    meetingPreference: {
      type: String,
      default: "campus",
      enum: ["campus", "public", "flexible"],
    },
    images: [
      {
        type: String, // URLs of images
        required: true,
      },
    ],
    status: {
      type: String,
      default: "active",
      enum: ["active", "sold", "inactive"],
    },
    views: {
      type: Number,
      default: 0,
    },
    favorites: {
      type: Number,
      default: 0,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
