import type { Metadata } from "next";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DraftsContent from "./client";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";

export const metadata: Metadata = {
  title: "Drafts",
  robots: { index: false },
};

async function getDrafts() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  const isDev = process.env.NODE_ENV === "development";
  const supabase = isDev ? createAdminClient() : createClient(cookies());
  const { data: session, error } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("session_id", sessionId)
    .single();
  if (error || !session || !session.user_id) {
    redirect("/login");
  }
  const { data: drafts, error: draftsError } = await supabase
    .from("ambiances")
    .select("id, title, thumbnail, status, updated_at")
    .eq("user_id", session!.user_id)
    .in("status", ["draft", "submitted"]);
  return drafts;
}

export default async function Page() {
  const draftData = await getDrafts();
  if (!draftData) return <DraftsContent drafts={[]} />;
  draftData.sort(function (a, b) {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  const drafts: AmbianceData[] = draftData.map((entry) => {
    return {
      id: entry.id,
      title: entry.title,
      status: entry.status,
      thumbnail: entry.thumbnail,
      videoData: [],
      dateUpdated: new Date(entry.updated_at),
    };
  });
  return <DraftsContent drafts={drafts} />;
}
