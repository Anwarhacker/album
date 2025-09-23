import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Determine MIME type from URL or default to jpeg
    const mimeType = imageUrl.includes(".png")
      ? "image/png"
      : imageUrl.includes(".gif")
      ? "image/gif"
      : imageUrl.includes(".webp")
      ? "image/webp"
      : "image/jpeg";

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Analyze this image and provide a caption and tags. Format your response exactly as:\nCaption: [short descriptive caption under 20 words]\nTags: [tag1, tag2, tag3]\n\nDo not include any other text.",
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate caption" },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return NextResponse.json(
        { error: "No caption generated" },
        { status: 500 }
      );
    }

    const responseText = geminiData.candidates[0].content.parts[0].text.trim();

    // Parse the response for Caption: and Tags:
    const captionMatch = responseText.match(/Caption:\s*(.+)/i);
    const tagsMatch =
      responseText.match(/Tags:\s*\[([^\]]+)\]/i) ||
      responseText.match(/Tags:\s*(.+)/i);

    let caption = "Beautiful mehndi design";
    let tags = ["mehndi", "design"];

    if (captionMatch) {
      caption = captionMatch[1].trim();
      // Remove quotes if present
      if (caption.startsWith('"') && caption.endsWith('"')) {
        caption = caption.slice(1, -1);
      }
    }

    if (tagsMatch) {
      try {
        let tagsString = tagsMatch[1] || tagsMatch[0].split(":")[1].trim();
        // If it's [tag1, tag2], parse as array
        if (tagsString.startsWith("[") && tagsString.endsWith("]")) {
          tags = tagsString
            .slice(1, -1)
            .split(",")
            .map((tag) => tag.trim().replace(/"/g, ""));
        } else {
          // Assume comma separated
          tags = tagsString
            .split(",")
            .map((tag) => tag.trim().replace(/"/g, ""));
        }
        tags = tags.filter((tag) => tag.length > 0);
        if (tags.length === 0) {
          tags = ["mehndi", "design"];
        }
      } catch (tagError) {
        console.warn("Failed to parse tags:", tagError);
        tags = ["mehndi", "design"];
      }
    }

    return NextResponse.json({ caption, tags });

    // Final fallback: treat entire response as caption
    return NextResponse.json({
      caption: "Beautiful mehndi design",
      tags: ["mehndi", "design"],
    });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    );
  }
}
