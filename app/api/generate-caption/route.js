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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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
                  text: "Analyze this image and provide a JSON response with two fields: 'caption' (a concise, descriptive caption like describing in Quotes form under 20 words) and 'tags' (an array of 2-3 relevant tags that describe the image content, style, and key elements). Format your response as valid JSON only.",
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
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

    // Handle markdown code blocks (```json ... ```)
    let jsonText = responseText;
    if (responseText.startsWith("```json")) {
      jsonText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (responseText.startsWith("```")) {
      jsonText = responseText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Try to parse as JSON
    try {
      const parsedResponse = JSON.parse(jsonText);
      if (parsedResponse.caption && parsedResponse.tags) {
        return NextResponse.json({
          caption: parsedResponse.caption,
          tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags : [],
        });
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON response:", parseError);
      console.warn("Response text:", responseText);
    }

    // Fallback: try to extract caption and tags from markdown response using regex
    const captionMatch = responseText.match(/"caption":\s*"([^"]+)"/);
    const tagsMatch = responseText.match(/"tags":\s*\[([^\]]+)\]/);

    if (captionMatch) {
      const caption = captionMatch[1];
      let tags = ["mehndi", "design"]; // Default tags

      if (tagsMatch) {
        try {
          // Extract and clean tag strings
          tags = tagsMatch[1]
            .split(",")
            .map((tag) => tag.trim().replace(/"/g, ""))
            .filter((tag) => tag.length > 0);
        } catch (tagError) {
          console.warn("Failed to parse tags:", tagError);
        }
      }

      return NextResponse.json({ caption, tags });
    }

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
