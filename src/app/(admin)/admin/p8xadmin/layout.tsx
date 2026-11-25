import { notFound } from "next/navigation";
import { verifyAdmin } from "@/app/lib/auth/adminAuth";
import styles from "./layout.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await verifyAdmin();
  if ("error" in result) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <div className={styles.page_content}>{children}</div>
    </div>
  );
}
