import connectDB from "../../../../lib/mongodb";
import Photo from "../../../../models/Photo";
import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const { email, password, photoIds } = await request.json();

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return Response.json({ error: "Photo IDs required" }, { status: 400 });
  }

  try {
    await connectDB();

    const photos = await Photo.find({ _id: { $in: photoIds } });

    // Delete from Cloudinary
    const deletePromises = photos.map((photo) =>
      cloudinary.v2.uploader.destroy(photo.public_id)
    );
    await Promise.all(deletePromises);

    // Delete from DB
    await Photo.deleteMany({ _id: { $in: photoIds } });

    return Response.json({
      message: `${photoIds.length} photos deleted successfully`,
    });
  } catch (error) {
    console.error("Delete photos error:", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
