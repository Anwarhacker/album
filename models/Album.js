import mongoose from "mongoose";

const AlbumSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  photos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photo",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Album || mongoose.model("Album", AlbumSchema);
