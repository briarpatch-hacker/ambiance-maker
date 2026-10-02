import styles from "./page.module.css";
import ReviewReport from "@/app/components/Admin/Review Report/reviewReport";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import NotFound from "@/app/components/Errors/Not Found/notFound";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReportPageData {
  ambianceData: AmbianceData;
  reportData: {
    id: string;
    reportType: "broken" | "other";
    message: string;
    reporter: string;
    createdAt: string;
  };
}

async function getReport(reportId: string): Promise<ReportPageData | null> {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = isDev ? createAdminClient() : createClient(cookies());

  // Fetch the report with joined ambiance and reporter info
  const { data: report, error } = await supabase
    .from("ambiance_reports")
    .select(
      `
      id,
      ambiance_id,
      report_type,
      message,
      created_at,
      users:user_id ( username ),
      ambiances:ambiance_id (
        id,
        title,
        description,
        video_data,
        user_id,
        users:user_id ( username )
      )
    `,
    )
    .eq("id", reportId)
    .eq("status", "pending")
    .single();

  if (error || !report) {
    return null;
  }

  const ambiance = report.ambiances as any;
  const reporter = report.users as any;
  const ambianceAuthor = ambiance?.users as any;

  if (!ambiance) return null;

  // Transform video_data from stored format to VideoData[]
  const videoData = (ambiance.video_data as any[]).map((v: any) => ({
    src: v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : "",
    startTime: v.startTime,
    endTime: v.endTime,
    volume: v.volume,
    playbackSpeed: v.playbackSpeed,
    loopDelay: v.loopDelay,
  }));

  return {
    ambianceData: {
      id: ambiance.id,
      title: ambiance.title,
      description: ambiance.description,
      author: ambianceAuthor?.username ?? "Unknown",
      videoData,
    },
    reportData: {
      id: report.id,
      reportType: report.report_type as "broken" | "other",
      message: report.message || "",
      reporter: reporter?.username ?? "Unknown",
      createdAt: report.created_at,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const result = await getReport(id);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        {result ? (
          <ReviewReport
            ambianceData={result.ambianceData}
            reportData={result.reportData}
          />
        ) : (
          <NotFound
            errorMessage="Report not found"
            buttonText="Go Back"
            href="/test_pages/admin/reports"
          />
        )}
      </div>
    </div>
  );
}
