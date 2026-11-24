import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import { getUserId } from "@/app/lib/auth/getCurrentUser";
import { cookies } from "next/headers";

// Maximum pending reports a single user can have
const MAX_REPORTS_PER_USER = 5;

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to submit a report." },
        { status: 401 },
      );
    }

    // Parse request body
    let body: { ambianceId?: string; reportType?: string; message?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const { ambianceId, reportType, message } = body;

    // Validate inputs
    if (!ambianceId || typeof ambianceId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid ambiance ID." },
        { status: 400 },
      );
    }

    if (reportType !== "broken" && reportType !== "other") {
      return NextResponse.json(
        { error: "Invalid report type." },
        { status: 400 },
      );
    }

    const trimmedMessage =
      reportType === "other" && typeof message === "string"
        ? message.trim().slice(0, 200)
        : "";

    // Use admin client for checks that need to bypass RLS
    const isDev = process.env.NODE_ENV === "development";
    const cookieStore = cookies();
    const admin = isDev ? createAdminClient() : createClient(cookieStore);

    // Check if user is shadowbanned — give false positive if so
    const { data: userProfile } = await admin
      .from("users")
      .select("account_status")
      .eq("id", userId)
      .single();

    if (userProfile?.account_status === "shadowbanned") {
      // False positive: pretend it succeeded
      return NextResponse.json({ success: true });
    }

    // Check report cap — give false positive if exceeded
    const { count } = await admin
      .from("ambiance_reports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending");

    if (count !== null && count >= MAX_REPORTS_PER_USER) {
      // False positive: pretend it succeeded
      return NextResponse.json({ success: true });
    }

    // Verify the ambiance exists and is published
    const { data: ambiance } = await admin
      .from("ambiances")
      .select("id, status")
      .eq("id", ambianceId)
      .single();

    if (!ambiance || ambiance.status !== "published") {
      return NextResponse.json(
        { error: "This ambiance could not be found." },
        { status: 404 },
      );
    }

    // Insert the report (UNIQUE constraint on ambiance_id + user_id prevents duplicates)
    const { error: insertError } = await admin
      .from("ambiance_reports")
      .insert({
        ambiance_id: ambianceId,
        user_id: userId,
        report_type: reportType,
        message: trimmedMessage,
      });

    if (insertError) {
      // Duplicate report (unique constraint violation) — false positive
      if (insertError.code === "23505") {
        return NextResponse.json({ success: true });
      }
      console.error("Report insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit report." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Report endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
