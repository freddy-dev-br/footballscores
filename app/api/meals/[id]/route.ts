import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM meals WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
