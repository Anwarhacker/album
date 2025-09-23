import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Photo from "@/models/Photo";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const album = searchParams.get("album");

    let query = { user_id: session.user.id };

    if (fromDate || toDate) {
      query.photo_date = {};
      if (fromDate) {
        query.photo_date.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Include the entire toDate day
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        query.photo_date.$lt = endDate;
      }
    }

    if (album) {
      // Assuming album is album id, but for now, skip
    }

    const photos = await Photo.find(query)
      .sort({ photo_date: -1, created_at: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Photo.countDocuments(query);

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}
