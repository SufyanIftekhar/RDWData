"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront } from "lucide-react";
import styles from "./VehicleNavBar.module.css";

const navItems = [
  { href: "", label: "Overview" },
  { href: "technical-specs", label: "Tech Specs" },
  { href: "risk-overview", label: "Risk Overview" },
  { href: "mileage-history", label: "Mileage" },
  { href: "inspection-timeline", label: "APK Timeline" },
  { href: "damage-history", label: "Damage" },
  { href: "ownership-history", label: "Ownership" },
  { href: "market-analysis", label: "Market" }
];

type Props = {
  plate: string;
  subtitle?: string;
};

export function VehicleNavBar({ plate, subtitle = "Open detailed reports" }: Props) {
  const pathname = usePathname() ?? "";
  const base = `/search/${plate}`;

  return (
    <div className={styles.topbar}>
      <div className={styles.brandBlock}>
        <div className={styles.brandMark}>
          <CarFront size={18} />
        </div>
        <div className={styles.brandCopy}>
          <div className={styles.brandTitle}>Vehicle Overview</div>
          <div className={styles.brandSubtitle}>{subtitle}</div>
        </div>
      </div>
      <div className={styles.topbarRight}>
        {navItems.map((item) => {
          const href = item.href ? `${base}/${item.href}` : base;
          const isActive = pathname === href || pathname === `${href}/`;
          return (
            <Link
              key={item.href}
              href={href}
              className={`${styles.navPill} ${isActive ? styles.navPillActive : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
