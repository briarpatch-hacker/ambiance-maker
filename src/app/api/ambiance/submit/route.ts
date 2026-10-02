import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { randomString } from "@/app/lib/randomString";
import { cookies } from "next/headers";
import {
  submitAmbianceSchema,
  getVideoId,
  transformVideoDataForStorage,
  type VideoDataInput,
} from "@/app/lib/schemas/ambiance";
import { getUserId } from "@/app/lib/auth/getCurrentUser";

// Submits the video for publication
export async function POST(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const cookieStore = cookies();

    // In dev, use admin client to bypass RLS; in prod, use regular client
    const supabase = isDev ? createAdminClient() : createClient(cookieStore);

    // Get authenticated user
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to submit an ambiance." },
        { status: 401 },
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    // Transform the v1-v6 format to videoData array if needed
    let transformedBody = body as Record<string, unknown>;
    if (!transformedBody.videoData && transformedBody.v1 !== undefined) {
      const videoData: VideoDataInput[] = [];
      for (let i = 1; i <= 6; i++) {
        const videoKey = `v${i}` as keyof typeof transformedBody;
        const video = transformedBody[videoKey] as VideoDataInput | undefined;
        videoData.push({
          src: video?.src || "",
          volume: video?.volume,
          startTime: video?.startTime,
          endTime: video?.endTime,
          playbackSpeed: video?.playbackSpeed,
          loopDelay: video?.loopDelay,
        });
      }
      transformedBody = {
        id: transformedBody.id,
        title: transformedBody.title,
        description: transformedBody.description,
        category_id: transformedBody.category_id,
        videoData,
      };
    }

    // Validate with Zod
    const parseResult = submitAmbianceSchema.safeParse(transformedBody);

    if (!parseResult.success) {
      console.error("Validation errors:", parseResult.error.issues);
      return NextResponse.json(
        { error: "Invalid submission data." },
        { status: 400 },
      );
    }

    const { id, title, description, category_id, videoData } = parseResult.data;

    // Ensure at least 2 videos have valid sources
    const validVideoCount = videoData.filter(
      (v) => v.src && getVideoId(v.src),
    ).length;
    if (validVideoCount < 2) {
      return NextResponse.json(
        { error: "At least 2 videos with valid YouTube URLs are required." },
        { status: 400 },
      );
    }

    // Transform video data to extract just the video IDs for storage
    const videoDataForStorage = transformVideoDataForStorage(videoData);

    // Generate thumbnail from first valid video
    const firstVideo = videoData.find((v) => v.src && getVideoId(v.src));
    const thumbnail = firstVideo
      ? `https://img.youtube.com/vi/${getVideoId(firstVideo.src!)}/mqdefault.jpg`
      : null;

    let ambiance;
    let error;

    // Check submitted ambiance limit (max 5 submitted at once)
    const { count: submittedCount } = await supabase
      .from("ambiances")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "submitted");

    if (id) {
      // Update existing ambiance to submitted - verify ownership first
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

      if (existing.status === "published") {
        return NextResponse.json(
          { error: "This ambiance is already published." },
          { status: 400 },
        );
      }

      // If changing from draft to submitted, enforce the 5-submitted limit
      if (
        existing.status === "draft" &&
        submittedCount !== null &&
        submittedCount >= 5
      ) {
        return NextResponse.json(
          {
            error:
              "You can only have 5 ambiances submitted for review at a time. Please wait for one to be reviewed.",
            code: "MAX_SUBMISSIONS",
          },
          { status: 400 },
        );
      }

      // Update and submit
      const result = await supabase
        .from("ambiances")
        .update({
          title,
          description,
          category_id,
          status: "submitted",
          video_data: videoDataForStorage,
          thumbnail,
        })
        .eq("id", id)
        .select("id, title, status, created_at, updated_at")
        .single();

      ambiance = result.data;
      error = result.error;
    } else {
      // Check unpublished limit before creating new submission
      const { count } = await supabase
        .from("ambiances")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["draft", "submitted"]);

      if (count !== null && count >= 50) {
        return NextResponse.json(
          {
            error:
              "You've reached the maximum of 50 unpublished ambiances. Please delete some drafts to create new ones.",
            code: "MAX_DRAFTS",
          },
          { status: 400 },
        );
      }

      // Check submitted limit for new submissions
      if (submittedCount !== null && submittedCount >= 5) {
        return NextResponse.json(
          {
            error:
              "You can only have 5 ambiances submitted for review at a time. Please wait for one to be reviewed.",
            code: "MAX_SUBMISSIONS",
          },
          { status: 400 },
        );
      }

      // Insert new submission directly (retry on collision)
      for (let attempt = 0; attempt < 3; attempt++) {
        const newId = randomString(12);
        const result = await supabase
          .from("ambiances")
          .insert({
            id: newId,
            user_id: userId,
            title,
            description,
            category_id,
            status: "submitted",
            video_data: videoDataForStorage,
            thumbnail,
          })
          .select("id, title, status, created_at, updated_at")
          .single();

        if (result.error) continue;
        ambiance = result.data;
        error = result.error;
        break;
      }

      if (!ambiance) {
        return NextResponse.json(
          { error: "Failed to create ambiance. Please try again." },
          { status: 500 },
        );
      }
    }

    if (error) {
      console.error("Error submitting ambiance:", error);
      return NextResponse.json(
        { error: "Failed to submit ambiance. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Ambiance submitted successfully! It will be reviewed for publication.",
      ...(id ? {} : { ambiance }),
    });
  } catch (error) {
    console.error("Unexpected error in submit route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

// Lightweight pre-check: returns whether the user can submit
export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const cookieStore = cookies();
    const supabase = isDev ? createAdminClient() : createClient(cookieStore);

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // If an id is provided, check if the ambiance still exists and its status
    const ambianceId = req.nextUrl.searchParams.get("id");
    if (ambianceId) {
      const { data: existing } = await supabase
        .from("ambiances")
        .select("user_id, status")
        .eq("id", ambianceId)
        .single();

      if (!existing || existing.user_id !== userId) {
        return NextResponse.json({ canSubmit: false, code: "NOT_FOUND" });
      }

      // Published ambiances cannot be submitted
      if (existing.status === "published") {
        return NextResponse.json({ canSubmit: false });
      }

      // Re-submitting an already-submitted ambiance doesn't increase the count
      if (existing.status === "submitted") {
        return NextResponse.json({ canSubmit: true });
      }
    }

    const { count } = await supabase
      .from("ambiances")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "submitted");

    return NextResponse.json({ canSubmit: (count ?? 0) < 5 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
