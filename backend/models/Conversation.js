import mongoose from "mongoose";

//Created for conversation.

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  checked: {
    type: Boolean,
    default: false,
  },
});
const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
