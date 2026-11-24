import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { getUserId } from "@/app/lib/auth/getCurrentUser";

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

    const admin = createAdminClient();
    const { data: accepted, error } = await admin.rpc("submit_ambiance_report", {
      p_user_id: userId,
      p_ambiance_id: ambianceId,
      p_report_type: reportType,
      p_message: trimmedMessage,
    });

    if (error) {
      console.error("Report submission error:", error);
      return NextResponse.json(
        { error: "Failed to submit report." },
        { status: 500 },
      );
    }

    if (accepted !== true) {
      return NextResponse.json(
        { error: "This ambiance could not be found." },
        { status: 404 },
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
