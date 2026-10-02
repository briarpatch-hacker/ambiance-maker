import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { randomString } from "@/app/lib/randomString";
import { cookies } from "next/headers";
import {
  saveAmbianceSchema,
  transformVideoDataForStorage,
  getVideoId,
  type VideoDataInput,
} from "@/app/lib/schemas/ambiance";
import { getUserId } from "@/app/lib/auth/getCurrentUser";

// Saves the ambiance as a draft
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
        { error: "Unauthorized. Please log in to save an ambiance." },
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
    const published = transformedBody.published === true;
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
        videoData,
      };
    }

    // Validate with Zod (relaxed for drafts)
    const parseResult = saveAmbianceSchema.safeParse(transformedBody);

    if (!parseResult.success) {
      console.error("Validation errors:", parseResult.error.issues);
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    const { id: rawId, title, description, videoData } = parseResult.data;
    // When forking from a published ambiance, ignore the source id so a new draft is created
    const id = published ? undefined : rawId;

    // Transform video data to extract just the video IDs for storage
    const videoDataForStorage = transformVideoDataForStorage(videoData);

    // Generate thumbnail from first valid video
    const firstVideo = videoData.find((v) => v.src && getVideoId(v.src));
    const thumbnail = firstVideo
      ? `https://img.youtube.com//vi/${getVideoId(firstVideo.src!)}/mqdefault.jpg`
      : null;

    let ambiance;
    let error;

    if (id) {
      // Update existing draft - verify ownership first
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
          { error: "Cannot edit a published ambiance." },
          { status: 400 },
        );
      }

      // Update the draft
      const result = await supabase
        .from("ambiances")
        .update({
          title: title || "Untitled",
          description: description || "",
          video_data: videoDataForStorage,
          thumbnail,
        })
        .eq("id", id)
        .select("id, title, status, created_at, updated_at")
        .single();

      ambiance = result.data;
      error = result.error;
    } else {
      // Check unpublished limit before creating new draft
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

      // Insert new draft (retry on collision)
      for (let attempt = 0; attempt < 3; attempt++) {
        const newId = randomString(12);
        const result = await supabase
          .from("ambiances")
          .insert({
            id: newId,
            user_id: userId,
            title: title || "Untitled",
            description: description || "",
            status: "draft",
            video_data: videoDataForStorage,
            thumbnail,
          })
          .select("id, title, status, created_at")
          .single();

        if (result.error) continue;
        ambiance = result.data;
        error = result.error;
        break;
      }

      if (!ambiance) {
        return NextResponse.json(
          { error: "Failed to save ambiance. Please try again." },
          { status: 500 },
        );
      }
    }

    if (error) {
      console.error("Error saving ambiance:", error);
      return NextResponse.json(
        { error: "Failed to save ambiance. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: id ? "Ambiance updated." : "Ambiance saved as draft.",
      ambiance,
    });
  } catch (error) {
    console.error("Unexpected error in save route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
