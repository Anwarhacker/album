import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Album from "@/models/Album";
import Photo from "@/models/Photo";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { photoId } = await request.json();
    const { id: albumId } = await params;

    // Verify album belongs to user
    const album = await Album.findOne({
      _id: albumId,
      user_id: session.user.id,
    });
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Verify photo belongs to user
    const photo = await Photo.findOne({
      _id: photoId,
      user_id: session.user.id,
    });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Check if photo is already in album
    if (album.photos.includes(photoId)) {
      return NextResponse.json(
        { error: "Photo already in album" },
        { status: 400 }
      );
    }

    // Add photo to album
    album.photos.push(photoId);
    await album.save();

    return NextResponse.json({ message: "Photo added to album", album });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add photo to album" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { photoId } = await request.json();
    const { id: albumId } = await params;

    // Verify album belongs to user
    const album = await Album.findOne({
      _id: albumId,
      user_id: session.user.id,
    });
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Remove photo from album
    album.photos = album.photos.filter((id) => id.toString() !== photoId);
    await album.save();

    return NextResponse.json({ message: "Photo removed from album", album });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to remove photo from album" },
      { status: 500 }
    );
  }
}
