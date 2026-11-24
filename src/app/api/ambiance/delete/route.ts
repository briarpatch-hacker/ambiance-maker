import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";
import { getUserId } from "@/app/lib/auth/getCurrentUser";

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, logout: true, error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided." },
        { status: 400 },
      );
    }

    // Each item must be a non-empty string; cap at 50 (the max drafts limit)
    if (
      items.length > 50 ||
      !items.every((item: unknown) => typeof item === "string" && item.length > 0)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid items." },
        { status: 400 },
      );
    }

    const isDev = process.env.NODE_ENV === "development";
    const cookieStore = cookies();

    // In dev, use admin client to bypass RLS; in prod, use regular client
    const supabase = isDev ? createAdminClient() : createClient(cookieStore);

    const { error } = await supabase
      .from("ambiances")
      .delete()
      .in("id", items)
      .eq("user_id", userId);

    if (error) {
      console.error("Delete ambiance error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete ambiance(s)." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete ambiance unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
