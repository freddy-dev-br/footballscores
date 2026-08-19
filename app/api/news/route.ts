import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/rss";

export async function GET() {
  try {
    const items = await fetchAllNews();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
