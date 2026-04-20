import { connectMongo } from "@/lib/db/mongodb";
import { SiteSettingsModel } from "@/models/SiteSettings";
import { defaultSiteSettings, type PublicSiteSettings } from "./defaults";

function mergedSettings(doc: Record<string, unknown>): PublicSiteSettings {
  return {
    paymentEnabled: (doc.paymentEnabled as boolean) ?? defaultSiteSettings.paymentEnabled,
    payment: { ...defaultSiteSettings.payment, ...((doc.payment ?? {}) as object) },
    lockSections: { ...defaultSiteSettings.lockSections, ...((doc.lockSections ?? {}) as object) },
    ui: { ...defaultSiteSettings.ui, ...((doc.ui ?? {}) as object) },
    content: { ...defaultSiteSettings.content, ...((doc.content ?? {}) as object) },
    landing: (() => {
      const l = (doc.landing ?? {}) as Record<string, unknown>;
      return {
        ...defaultSiteSettings.landing,
        ...l,
        sectionVisibility: {
          ...defaultSiteSettings.landing.sectionVisibility,
          ...((l.sectionVisibility ?? {}) as object)
        },
        footer: {
          ...defaultSiteSettings.landing.footer,
          ...((l.footer ?? {}) as object)
        }
      };
    })(),
    seo: { ...defaultSiteSettings.seo, ...((doc.seo ?? {}) as object) },
    appearance: { ...defaultSiteSettings.appearance, ...((doc.appearance ?? {}) as object) },
    email: { ...defaultSiteSettings.email, ...((doc.email ?? {}) as object) }
  };
}

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  await connectMongo();
  const doc = await SiteSettingsModel.findOne({ key: "global" }).lean();
  if (!doc) {
    await SiteSettingsModel.create({ key: "global", ...defaultSiteSettings });
    return defaultSiteSettings;
  }
  return mergedSettings(doc as unknown as Record<string, unknown>);
}

export async function upsertSiteSettings(input: Partial<PublicSiteSettings>): Promise<PublicSiteSettings> {
  const current = await getSiteSettings();
  const next: PublicSiteSettings = {
    paymentEnabled: input.paymentEnabled ?? current.paymentEnabled,
    payment: { ...current.payment, ...(input.payment ?? {}) },
    lockSections: { ...current.lockSections, ...(input.lockSections ?? {}) },
    ui: { ...current.ui, ...(input.ui ?? {}) },
    content: { ...current.content, ...(input.content ?? {}) },
    landing: {
      ...current.landing,
      ...(input.landing ?? {}),
      sectionVisibility: {
        ...current.landing.sectionVisibility,
        ...(input.landing?.sectionVisibility ?? {})
      },
      footer: {
        ...current.landing.footer,
        ...(input.landing?.footer ?? {})
      }
    },
    seo: { ...current.seo, ...(input.seo ?? {}) },
    appearance: { ...current.appearance, ...(input.appearance ?? {}) },
    email: { ...current.email, ...(input.email ?? {}) }
  };

  await SiteSettingsModel.updateOne({ key: "global" }, { $set: { ...next } }, { upsert: true });
  return next;
}
