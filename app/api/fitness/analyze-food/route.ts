import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { image_base64, media_type, goal } = body;

  if (!image_base64) {
    return Response.json({ error: "Missing image_base64" }, { status: 400 });
  }

  const goalContext = goal
    ? `The user's fitness goal is: ${goal}.`
    : "The user's goal is general health maintenance.";

  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: media_type || "image/jpeg",
              data: image_base64,
            },
          },
          {
            type: "text",
            text: `Analyze this food photo and provide nutritional information. ${goalContext}

Respond ONLY with a JSON object (no markdown, no backticks) with these fields:
{
  "name": "food name",
  "description": "brief description",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "meal_type": "breakfast|lunch|dinner|snack",
  "advice": "personalized advice for the user's goal in 1-2 sentences"
}`,
          },
        ],
      },
    ],
  });

  const message = await stream.finalMessage();
  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return Response.json({ error: "No response from AI" }, { status: 500 });
  }

  try {
    const cleaned = textContent.text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Failed to parse AI response", raw: textContent.text }, { status: 500 });
  }
}
