"use client";
import AmbianceMaker from "@/app/components/Ambiance Maker/ambianceMaker";
import styles from "./page.module.css";
import { useUser } from "@/app/contexts/userContext";
import { usePageView } from "@/app/components/Page View/pageView";

export default function Page() {
  const user = useUser();
  usePageView("create");

  return (
    <div className={styles.create}>
      <div className={styles.ambiance_maker_wrapper}>
        <AmbianceMaker mode="create" user={user} />
      </div>
    </div>
  );
}
