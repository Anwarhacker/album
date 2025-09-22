import connectDB from "../../../../lib/mongodb";
import Photo from "../../../../models/Photo";
import User from "../../../../models/User";

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
    const photos = await Photo.find({})
      .populate("user_id", "name email")
      .sort({ created_at: -1 });
    return Response.json({ photos });
  } catch (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
