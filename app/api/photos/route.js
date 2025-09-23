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
    const search = searchParams.get("search") || "";
    const album = searchParams.get("album");

    let query = { user_id: session.user.id };

    if (search) {
      // Check if search is a date pattern (YYYY-MM-DD or YYYY-MM)
      const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;
      if (dateRegex.test(search)) {
        if (search.length === 7) {
          // YYYY-MM
          const start = new Date(`${search}-01`);
          const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          query.photo_date = { $gte: start, $lte: end };
        } else {
          // YYYY-MM-DD
          const date = new Date(search);
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          query.photo_date = { $gte: date, $lt: nextDay };
        }
      } else {
        // For now, no other search since caption/tags removed
        // Could add other fields later
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
