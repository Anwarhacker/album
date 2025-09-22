import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Album from "@/models/Album";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const albums = await Album.find({ user_id: session.user.id }).populate(
      "photos"
    );

    return NextResponse.json({ albums });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Album name is required" },
        { status: 400 }
      );
    }

    const album = new Album({
      user_id: session.user.id,
      name,
      description,
    });

    await album.save();

    return NextResponse.json({ album });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 }
    );
  }
}
