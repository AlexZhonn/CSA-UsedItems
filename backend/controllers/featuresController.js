import User from "../models/User.js";
import Post from "../models/Post.js";
// get all the features
export async function getFeatures(req, res) {
  try {
    const users = await User.countDocuments();
    const posts = await Post.find().countDocuments();
    const done = await Post.find({ status: "Done" }).countDocuments();
    res.json({ users, posts, done });
  } catch (err) {
    console.log(err);
  }
}
