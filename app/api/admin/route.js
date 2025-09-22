import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import Photo from "../../../models/Photo";

export async function POST(request) {
  const { email, password } = await request.json();

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    await connectDB();
    const users = await User.find({}, "name email createdAt").sort({
      createdAt: -1,
    });
    const userCount = users.length;

    // Add photo count for each user
    const usersWithPhotoCount = await Promise.all(
      users.map(async (user) => {
        const photoCount = await Photo.countDocuments({ user_id: user._id });
        return { ...user.toObject(), photoCount };
      })
    );

    return Response.json({ userCount, users: usersWithPhotoCount });
  } catch (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
