import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { getUserId } from "@/app/lib/auth/getCurrentUser";

// Withdraws a submitted ambiance back to draft status
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const { id } = body as { id?: string };
    if (!id) {
      return NextResponse.json(
        { error: "Ambiance ID is required." },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("ambiances")
      .select("user_id, status")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json(
        { error: "Ambiance not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (existing.status !== "submitted") {
      return NextResponse.json(
        { error: "This ambiance is not submitted." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("ambiances")
      .update({ status: "draft" })
      .eq("id", id)
      .eq("status", "submitted");

    if (error) {
      return NextResponse.json(
        { error: "Failed to withdraw submission." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission withdrawn. Your ambiance is now a draft.",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
