import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Album from "../../../../models/Album";
import Photo from "../../../../models/Photo";

export async function POST(request) {
  const { email, password, userId } = await request.json();

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!userId) {
    return Response.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    await connectDB();

    // Delete all photos by user
    await Photo.deleteMany({ user_id: userId });

    // Delete all albums by user
    await Album.deleteMany({ user_id: userId });

    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ message: "User and all data deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
