"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { normalizePlate, validateDutchPlate } from "@/lib/rdw/normalize";
import {
  Building2,
  Briefcase,
  MapPin,
  Scale,
  CarFront,
  Gauge,
  TrendingUp,
  Users,
  FileCheck,
  FileSpreadsheet,
  Sparkles,
  Twitter,
  Linkedin,
  Facebook,
  ShieldCheck
} from "lucide-react";
import styles from "./page.module.css";

const FEATURES = [
  {
    title: "Damage History",
    description: "Review visual damage markers and repair estimates to spot structural issues before you commit.",
    Icon: CarFront
  },
  {
    title: "Mileage Verification",
    description: "Track the true mileage trend and detect suspicious rollbacks with our weighted regression engine.",
    Icon: Gauge
  },
  {
    title: "Market Valuation",
    description: "Compare asking prices against real Dutch market data so you never overpay.",
    Icon: TrendingUp
  },
  {
    title: "Ownership Timeline",
    description: "See every transfer date, owner type, and whether the vehicle lived in the Netherlands or abroad.",
    Icon: Users
  },
  {
    title: "Inspection Records",
    description: "Surface APK history, defect flags, and upcoming inspection windows in one view.",
    Icon: FileCheck
  },
  {
    title: "Technical Specs",
    description: "Full breakdown of engine power, emissions, weights, and equipment straight from RDW.",
    Icon: FileSpreadsheet
  }
];

const WORKFLOW = [
  {
    title: "Enter the license plate",
    description: "Type any Dutch registration into the search box (domestic or imported)."
  },
  {
    title: "We gather the data",
    description: "Our pipeline merges RDW, inspection history, defects, and trusted partners for a single view."
  },
  {
    title: "Make a smart decision",
    description: "Review the report, highlight risks, and use market insights to negotiate with confidence."
  }
];

const FOOTER_LINKS = {
  product: ["Sample Report", "Pricing", "Features", "For Dealers"],
  company: ["About Us", "Careers", "Contact", "Partners"],
  legal: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Data Sources"]
};

function PlateSearch() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = () => {
    const plate = normalizePlate(value);
    if (!validateDutchPlate(plate)) {
      setError("Enter a valid Dutch plate like AB-123-C.");
      return;
    }
    router.push(`/search/${plate}`);
  };

  return (
    <div className={styles["search-wrapper"]}>
      <div className={styles["search-row"]}>
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Example: 16-RSL-9"
          className={styles["input-mock"]}
        />
        <button onClick={submit} className={styles["search-btn"]}>
          Get Report
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[#dc2626]">{error}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles["hero-section"]}>
          <div className={`${styles.badge} ${styles.badgePrimary}`}>
            <Sparkles size={14} /> The #1 Rated Vehicle History Platform
          </div>
          <h1 className={styles["hero-title"]}>
            Don’t buy your next car blindly. <span>Know its true history.</span>
          </h1>
          <p className={styles["hero-subtitle"]}>
            Instantly reveal hidden damage, mileage rollbacks, market value, and ownership history with just a license plate number.
          </p>
          <PlateSearch />
          <div className={styles["trust-logos"]}>
            <span>Trusted Data Sources</span>
            <Building2 size={20} />
            <Briefcase size={20} />
            <MapPin size={20} />
            <Scale size={20} />
          </div>
          <div className={styles["hero-image"]}>
            <Image
              src="https://storage.googleapis.com/banani-generated-images/generated-images/ad953e96-ea70-4d4d-ab60-fc21c7b01fb4.jpg"
              width={1200}
              height={675}
              alt="Platform dashboard"
              priority
              className="w-full h-auto"
            />
          </div>
        </section>

        <section id="features" className={styles.section}>
          <div className={styles["section-header"]}>
            <div className={styles.badge}>Comprehensive data</div>
            <h2 className={styles["section-title"]}>Everything you need to make a safe purchase</h2>
          </div>
          <div className={styles["features-grid"]}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={styles["feature-card"]}>
                <div className={styles["feature-icon"]}>
                  <feature.Icon size={28} />
                </div>
                <h3 className={styles["feature-title"]}>{feature.title}</h3>
                <p className={styles["feature-desc"]}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="sample" className={styles.section}>
          <div className={styles["section-header"]}>
            <div className={styles.badge}>How it works</div>
            <h2 className={styles["section-title"]}>Three simple steps to total peace of mind</h2>
          </div>
          <div className={styles["workflow-steps"]}>
            {WORKFLOW.map((step, index) => (
              <div key={step.title} className={styles["step-card"]}>
                <div className={styles["step-number"]}>{index + 1}</div>
                <h3 className={styles["step-title"]}>{step.title}</h3>
                <p className={styles["step-desc"]}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.cta}>
          <h2 className={styles["cta-title"]}>Ready to buy with confidence?</h2>
          <p className={styles["cta-subtitle"]}>Join over 1,000,000 smart buyers who checked their car before making a deal.</p>
          <button className={styles["cta-btn"]} data-media-type="banani-button">
            Start Your Check Now
          </button>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles["footer-grid"]}>
          <div>
            <div className={styles["nav-brand"]}>
              <div className={styles["brand-icon"]}>
                <ShieldCheck size={16} />
              </div>
              AutoCheck
            </div>
            <p className={styles["footer-desc"]}>
              The most comprehensive and transparent vehicle history reporting platform for buyers and dealers.
            </p>
          </div>
          <div>
            <div className={styles["footer-title"]}>Product</div>
            <div className={styles["footer-links"]}>
              {FOOTER_LINKS.product.map((item) => (
                <div key={item} className={styles["footer-link"]}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className={styles["footer-title"]}>Company</div>
            <div className={styles["footer-links"]}>
              {FOOTER_LINKS.company.map((item) => (
                <div key={item} className={styles["footer-link"]}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className={styles["footer-title"]}>Legal</div>
            <div className={styles["footer-links"]}>
              {FOOTER_LINKS.legal.map((item) => (
                <div key={item} className={styles["footer-link"]}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles["footer-bottom"]}>
          <div>© {new Date().getFullYear()} AutoCheck Inc. All rights reserved.</div>
          <div className={styles["social-icons"]}>
            <a className={styles["social-icon"]} href="https://twitter.com" aria-label="Twitter">
              <Twitter size={16} />
            </a>
            <a className={styles["social-icon"]} href="https://linkedin.com" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a className={styles["social-icon"]} href="https://facebook.com" aria-label="Facebook">
              <Facebook size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
