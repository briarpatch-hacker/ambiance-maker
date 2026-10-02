import { z } from "zod";
import { categoryMeta } from "@/app/lib/categories";

const validCategoryIds = new Set(Object.values(categoryMeta).map((c) => c.id));

// Helper to extract YouTube video ID from URL (exported for use elsewhere)
export function getVideoId(url: string): string | null {
  if (!url || url.trim() === "") return null;
  const match =
    url.match(
      /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/watch\?v=([\w-]+)/i,
    ) ||
    url.match(/(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/shorts\/([\w-]+)/i) ||
    url.match(/(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/embed\/([\w-]+)/i) ||
    url.match(/(?:https?:\/\/)?youtu\.be\/([\w-]+)/i) ||
    null;
  return match ? match[1] : null;
}

// Schema for individual video data (input - accepts URL or video ID)
export const videoDataInputSchema = z
  .object({
    src: z.string().optional().or(z.literal("")),
    volume: z.number().int().min(0).max(100).optional(),
    startTime: z.number().min(0).optional(),
    endTime: z.number().min(0).optional(),
    playbackSpeed: z.number().min(0.25).max(2).optional(),
    loopDelay: z.number().int().min(0).max(99).optional(),
  })
  .refine(
    (data) => {
      // If both startTime and endTime are defined, endTime must be >= startTime
      if (data.startTime !== undefined && data.endTime !== undefined) {
        return data.endTime >= data.startTime;
      }
      return true;
    },
    {
      message: "endTime must be greater than or equal to startTime",
      path: ["endTime"],
    },
  )
  .refine(
    (data) => {
      // If src is provided, it must be a valid YouTube URL or video ID
      if (data.src && data.src.trim() !== "") {
        return getVideoId(data.src) !== null;
      }
      return true;
    },
    {
      message: "Invalid YouTube URL or video ID",
      path: ["src"],
    },
  );

// Schema for stored video data (with videoId instead of src)
export const videoDataStoredSchema = z.object({
  videoId: z.string().optional().or(z.literal("")),
  volume: z.number().int().min(0).max(100).optional(),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  playbackSpeed: z.number().min(0.25).max(2).optional(),
  loopDelay: z.number().int().min(0).max(99).optional(),
});

// Legacy schema export for backwards compatibility
export const videoDataSchema = videoDataInputSchema;

// Schema for submitting an ambiance (strict validation)
export const submitAmbianceSchema = z.object({
  id: z.string().min(1).max(20).optional(), // Optional: provided when submitting existing draft
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(32, "Title must be 32 characters or less"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less"),
  category_id: z
    .number()
    .int("Category must be an integer ID")
    .refine((id) => validCategoryIds.has(id), { message: "Invalid category" }),
  videoData: z
    .array(videoDataSchema)
    .length(6, "Must provide exactly 6 video slots"),
});

// Schema for saving a draft (relaxed validation)
export const saveAmbianceSchema = z.object({
  id: z.string().min(1).max(20).optional(), // Optional: provided when updating existing draft
  title: z
    .string()
    .trim()
    .max(32, "Title must be 32 characters or less")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  videoData: z
    .array(videoDataSchema)
    .length(6, "Must provide exactly 6 video slots"),
});

// Schema for updating an ambiance (all fields optional except id)
export const updateAmbianceSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(32, "Title must be 32 characters or less")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  videoData: z
    .array(videoDataSchema)
    .length(6, "Must provide exactly 6 video slots")
    .optional(),
  status: z.enum(["draft", "submitted"]).optional(), // Users can't set to published
});

// Schema for rating an ambiance
export const rateAmbianceSchema = z.object({
  ambianceId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

// TypeScript types inferred from schemas
export type VideoDataInput = z.infer<typeof videoDataInputSchema>;
export type VideoDataStored = z.infer<typeof videoDataStoredSchema>;
export type SubmitAmbianceInput = z.infer<typeof submitAmbianceSchema>;
export type UpdateAmbianceInput = z.infer<typeof updateAmbianceSchema>;
export type RateAmbianceInput = z.infer<typeof rateAmbianceSchema>;

// Helper to transform input video data to stored format (extract video IDs)
export function transformVideoDataForStorage(
  videoData: VideoDataInput[],
): VideoDataStored[] {
  return videoData.map((video) => ({
    videoId: video.src ? getVideoId(video.src) || "" : "",
    volume: video.volume,
    startTime: video.startTime,
    endTime: video.endTime,
    playbackSpeed: video.playbackSpeed,
    loopDelay: video.loopDelay,
  }));
}

// Database row types
export interface AmbianceRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: "draft" | "submitted" | "published";
  video_data: VideoDataStored[]; // Stored with videoId
  category: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  views: number;
  rating_sum: number;
  rating_count: number;
}

export interface AmbianceRatingRow {
  id: string;
  ambiance_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

// Computed type for ambiance with author info (from join)
export interface AmbianceWithAuthor extends AmbianceRow {
  author?: {
    username: string;
    // Add other user fields as needed
  };
  average_rating?: number;
}

// Helper to compute average rating
export function computeAverageRating(
  ratingSum: number,
  ratingCount: number,
): number | null {
  if (ratingCount === 0) return null;
  return Math.round((ratingSum / ratingCount) * 10) / 10; // Round to 1 decimal
}
