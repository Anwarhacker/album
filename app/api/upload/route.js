import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import cloudinary from "cloudinary";
import connectDB from "@/lib/mongodb";
import Photo from "@/models/Photo";
import { format } from "date-fns";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file");
    const caption = formData.get("caption") || "";
    const tags = formData.get("tags")
      ? formData
          .get("tags")
          .split(",")
          .map((tag) => tag.trim())
      : [];
    const photoDate = formData.get("photoDate")
      ? new Date(formData.get("photoDate"))
      : new Date();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate folder path: mehndi-album/{user_id}/YYYY-MM
    const yearMonth = format(photoDate, "yyyy-MM");
    const folder = `mehndi-album/${session.user.id}/${yearMonth}`;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream(
          {
            folder,
            public_id: `${Date.now()}-${file.name}`,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    // Generate AI caption and tags if none provided
    let finalCaption = caption;
    let finalTags = tags;
    if (!caption || caption.trim() === "" || tags.length === 0) {
      try {
        const aiResponse = await fetch(
          `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/generate-caption`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Include session cookie for authentication
              Cookie: request.headers.get("cookie") || "",
            },
            body: JSON.stringify({
              imageUrl: result.secure_url,
            }),
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (!caption || caption.trim() === "") {
            finalCaption = aiData.caption;
          }
          if (tags.length === 0) {
            finalTags = aiData.tags || [];
          }
        } else {
          console.warn(
            "Failed to generate AI content:",
            await aiResponse.text()
          );
          if (!caption || caption.trim() === "") {
            finalCaption = "Beautiful mehndi design"; // Fallback caption
          }
          if (tags.length === 0) {
            finalTags = ["mehndi", "design"]; // Fallback tags
          }
        }
      } catch (error) {
        console.warn("Error generating AI content:", error);
        if (!caption || caption.trim() === "") {
          finalCaption = "Beautiful mehndi design"; // Fallback caption
        }
        if (tags.length === 0) {
          finalTags = ["mehndi", "design"]; // Fallback tags
        }
      }
    }

    // Save to MongoDB
    const photo = new Photo({
      user_id: session.user.id,
      public_id: result.public_id,
      url: result.secure_url,
      folder,
      caption: finalCaption,
      tags: finalTags,
      photo_date: photoDate,
    });

    await photo.save();

    return NextResponse.json({
      message: "Upload successful",
      photo: {
        id: photo._id,
        url: result.secure_url,
        public_id: result.public_id,
        folder,
        caption,
        tags,
        photo_date: photoDate,
        created_at: photo.created_at,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
