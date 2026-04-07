import { useEffect, useState, type ReactNode } from "react";
import styles from "./PremiumLock.module.css";
import { Button } from "./Button";
import { CheckCircle2, Lock } from "lucide-react";
import { SubscriptionModal } from "./SubscriptionModal";
import { useI18n } from "@/lib/i18n/context";
import { hasPaidAccessForPlate } from "@/lib/payments/access";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { PublicSiteSettings } from "@/lib/site-settings/defaults";



interface PremiumLockProps {
  children: ReactNode;
  isLocked?: boolean;
  featureName: string;
  plate?: string;
  sectionKey?: keyof PublicSiteSettings["lockSections"];
}

export function PremiumLock({ children, isLocked = true, featureName, plate, sectionKey }: PremiumLockProps) {
  const { locale } = useI18n();
  const { settings } = useSiteSettings();
  const [showModal, setShowModal] = useState(false);
  const [isUnlockedForPlate, setIsUnlockedForPlate] = useState(false);

  useEffect(() => {
    if (!plate) return;
    const localPaid = hasPaidAccessForPlate(plate);
    setIsUnlockedForPlate(localPaid);
  }, [plate]);

  const lockByAdmin = sectionKey ? settings.lockSections[sectionKey] : isLocked;
  const shouldLock = settings.paymentEnabled && lockByAdmin && isLocked;

  if (!shouldLock || isUnlockedForPlate) return <>{children}</>;

  const premiumFeatures = [
    { id: "mileage", label: locale === "nl" ? "Volledige kilometerhistorie (NAP)" : "Full Odometer History (NAP)" },
    { id: "damage", label: locale === "nl" ? "Schade- en reparatieregistraties" : "Damage & Repair Records" },
    { id: "valuation", label: locale === "nl" ? "Realtime marktwaardering" : "Real-time Market Valuation" },
    { id: "ownership", label: locale === "nl" ? "Eigendomshistorie" : "Ownership Duration History" },
    { id: "stolen", label: locale === "nl" ? "Diefstal- en politiemeldingen" : "Stolen & Police Signal Status" },
    { id: "vin", label: locale === "nl" ? "Geverifieerde VIN- en buildspecificaties" : "Verified VIN & Build Specs" }
  ];

  const openModal = () => setShowModal(true);

  return (
    <div className={styles.lockContainer}>
      <div className={styles.contentBlur}>
        {children}
      </div>
      <div className={styles.overlay}>
        <button className={styles.lockBadge} onClick={openModal} aria-label={locale === "nl" ? "Functie ontgrendelen" : "Unlock feature"}>
          <Lock size={20} />
          <span>{locale === "nl" ? "Vergrendeld" : "Locked"}</span>
        </button>

        <div className={styles.lockCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <div className={styles.pulse} />
              <Lock className={styles.lockIcon} size={32} />
            </div>
            <h3 className={styles.title}>{locale === "nl" ? `Ontgrendel ${featureName}` : `Unlock ${featureName}`}</h3>
            <p className={styles.description}>
              {locale === "nl"
                ? `Ontgrendel uitgebreide data, geverifieerd door officiele databronnen, voor ${featureName}.`
                : `Unlock comprehensive data verified by official industry partners for this ${featureName}.`}
            </p>
          </div>

          <div className={styles.featureList}>
            {premiumFeatures.map((f) => (
              <div key={f.id} className={styles.featureItem}>
                <CheckCircle2 size={14} className={styles.checkIcon} />
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          <Button variant="primary" className={styles.unlockButton} onClick={openModal}>
            {locale === "nl" ? "Upgrade naar Premium" : "Upgrade to Premium Now"}
          </Button>

        </div>
      </div>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName={featureName}
        plate={plate ?? ""}
        onUnlocked={() => setIsUnlockedForPlate(true)}
      />
    </div>
  );
}


