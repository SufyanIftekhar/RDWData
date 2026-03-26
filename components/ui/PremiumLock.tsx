import React, { useState } from "react";
import styles from "./PremiumLock.module.css";
import { Button } from "./Button";
import { CheckCircle2, Lock } from "lucide-react";
import { SubscriptionModal } from "./SubscriptionModal";



const premiumFeatures = [
  { id: "mileage", label: "Full Odometer History (NAP)" },
  { id: "damage", label: "Damage & Repair Records" },
  { id: "valuation", label: "Real-time Market Valuation" },
  { id: "ownership", label: "Ownership Duration Duration History" },
  { id: "stolen", label: "Stolen & Police Signal Status" },
  { id: "vin", label: "Verified VIN & Build Specs" }
];

interface PremiumLockProps {
  children: React.ReactNode;
  isLocked?: boolean;
  featureName: string;
}

export function PremiumLock({ children, isLocked = true, featureName }: PremiumLockProps) {
  const [showModal, setShowModal] = useState(false);

  if (!isLocked) return <>{children}</>;

  const openModal = () => setShowModal(true);

  return (
    <div className={styles.lockContainer}>
      <div className={styles.contentBlur}>
        {children}
      </div>
      <div className={styles.overlay}>
        <button className={styles.lockBadge} onClick={openModal} aria-label="Unlock feature">
          <Lock size={20} />
          <span>Locked</span>
        </button>

        <div className={styles.lockCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <div className={styles.pulse} />
              <Lock className={styles.lockIcon} size={32} />
            </div>
            <h3 className={styles.title}>Unlock {featureName}</h3>
            <p className={styles.description}>
              Unlock comprehensive data verified by official industry partners for this {featureName}.
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
            Upgrade to Premium Now
          </Button>

        </div>
      </div>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName={featureName}
      />
    </div>
  );
}


