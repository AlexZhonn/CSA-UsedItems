import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  PhoneNumber: {
    type: String,
  },
  description: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  reviews: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  sold: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  active: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  conversations: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  ],
  rating: {
    type: Number,
    default: 5,
  },
  publicKey: {
    type: String,
    default: "",
  },
});

const User = mongoose.model("User", userSchema);
export default User;
