import Link from "next/link";
import styles from "./page.module.css";

const adminPages = [
  { href: "/p8xadmin/submitted", label: "Submitted Ambiances" },
  { href: "/p8xadmin/reports", label: "Reports" },
  { href: "/p8xadmin/share-hits", label: "Share Hits" },
];

export default function Page() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Admin</h1>
      <nav aria-label="Admin pages">
        <ul className={styles.links}>
          {adminPages.map(({ href, label }) => (
            <li key={href}>
              <Link className={styles.link} href={href}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
