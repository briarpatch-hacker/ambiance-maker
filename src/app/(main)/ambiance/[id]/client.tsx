"use client";
import AmbianceMaker from "@/app/components/Ambiance Maker/ambianceMaker";
import styles from "./page.module.css";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import { useUser } from "@/app/contexts/userContext";
import { usePageView } from "@/app/components/Page View/pageView";

export default function AmbianceClient({
  ambianceData,
}: {
  ambianceData: AmbianceData;
}) {
  const user = useUser();
  // Aggregate page hit for daily_visitors; per-ambiance views are recorded
  // server-side in page.tsx with their own 3-day dedup
  usePageView("ambiance");

  return (
    <div className={styles.ambiance}>
      <div className={styles.ambiance_maker_wrapper}>
        <AmbianceMaker
          mode="published"
          ambianceData={ambianceData}
          user={user}
        />
      </div>
    </div>
  );
}
