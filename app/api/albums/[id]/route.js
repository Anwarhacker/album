import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Album from "@/models/Album";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const album = await Album.findOne({
      _id: id,
      user_id: session.user.id,
    }).populate("photos");

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({ album });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const { name, description } = await request.json();

    const album = await Album.findOneAndUpdate(
      { _id: id, user_id: session.user.id },
      { name, description },
      { new: true }
    );

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({ album });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update album" },
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

    const { id } = await params;

    const album = await Album.findOneAndDelete({
      _id: id,
      user_id: session.user.id,
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Album deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 }
    );
  }
}
