import mongoose from "mongoose";

const PhotoSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  folder: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: "",
  },
  tags: [
    {
      type: String,
    },
  ],
  photo_date: {
    type: Date,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Photo || mongoose.model("Photo", PhotoSchema);
