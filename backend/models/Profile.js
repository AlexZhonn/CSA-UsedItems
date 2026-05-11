import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  FirstName: {
    type: String,
  },
  LastName: {
    type: String,
  },
});
const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
