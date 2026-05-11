import mongoose from "mongoose";
import { act } from "react";

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
    default: "",
  },
  PhoneNumber: {
    type: String,
    // required: true,
    //TODO: later should add a phone number
  },
  description: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "Gainesville, FL",
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
  verified: {
    type: Boolean,
  },
  rating: {
    type: Number,
    default: 5,
  },
});
const User = mongoose.model("User", userSchema);
export default User;
