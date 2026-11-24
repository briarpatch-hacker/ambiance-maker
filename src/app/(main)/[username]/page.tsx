import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";
import UsernameClient, { InitialOwnerData } from "./client";
import { getCurrentUser } from "@/app/lib/auth/getCurrentUser";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getOwnerInitialData(
  username: string,
): Promise<InitialOwnerData | null> {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const supabase = isDev ? createAdminClient() : createClient(cookies());
    const pageSize = 40;

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!user?.id) return null;

    const { count } = await supabase
      .from("ambiances")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "published");

    const totalCount = count ?? 0;
    const numPages = Math.max(Math.ceil(totalCount / pageSize), 1);

    const { data: items } = await supabase
      .from("ambiances")
      .select(
        "id, title, thumbnail, views, status, published_at, rating_score, rating_count",
      )
      .eq("user_id", user.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(0, pageSize - 1);

    return {
      items: (items || []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        status: entry.status,
        thumbnail: entry.thumbnail,
        views: entry.views,
        ratingTotal: entry.rating_score ?? undefined,
        ratingCount: entry.rating_count ?? undefined,
        datePublished: entry.published_at ?? undefined,
        videoData: [],
      })),
      numPages,
      page: 1,
      sort: "newest",
    };
  } catch {
    return null;
  }
}

// Checks if the username exists, if they have publihed ambiance, and returns it with correct uppercase/lowercases if it does
const getUsername = cache(
  async (username: string): Promise<string | undefined> => {
    const isDev = process.env.NODE_ENV === "development";
    const supabase = isDev ? createAdminClient() : createClient(cookies());
    const { data, error } = await supabase
      .from("users")
      .select("username, id")
      .ilike("username", username)
      .single();
    if (error || !data?.id) {
      return undefined;
    }
    const { data: ambData, error: ambError } = await supabase
      .from("ambiances")
      .select("id")
      .eq("user_id", data.id)
      .eq("status", "published")
      .limit(1);
    if (ambError || !ambData?.length) {
      return undefined;
    }
    return data.username;
  },
);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  if (username.slice(0, 3) !== "%40") return {};
  const rawName = username.slice(3);
  const correctUsername = await getUsername(rawName);
  if (!correctUsername) return {};
  return {
    title: correctUsername,
    description: `Browse ambiances by ${correctUsername} on Ambiance Maker.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { username } = await params;
  if (username.slice(0, 3) === "%40") {
    const rawName = username.slice(3);

    // Check if the visiting user owns this profile
    const currentUser = await getCurrentUser();
    if (
      currentUser &&
      currentUser.username.toLowerCase() === rawName.toLowerCase()
    ) {
      const initialData = await getOwnerInitialData(currentUser.username);
      return (
        <UsernameClient
          username={currentUser.username}
          isOwner={true}
          initialData={initialData}
        />
      );
    }

    // Non-owner: verify user exists and has published ambiances
    const correctUsername = await getUsername(rawName);
    if (correctUsername) {
      return <UsernameClient username={correctUsername} />;
    }
  }
  notFound();
}
