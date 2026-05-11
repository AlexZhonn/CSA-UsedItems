import mongoose from "mongoose";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

export async function getProfile(req, res) {
  try {
    const profile = await Profile.find();
    if (!profile || profile.length === 0) {
      return res.status(404).json({ msg: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    console.error("Error fetching profiles:", err);
    res.status(500).json({ msg: err.message });
  }
}
