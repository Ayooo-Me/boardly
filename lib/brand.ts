import { getBrandSettings } from "@/lib/db";

export type BrandSettings = { name: string; tagline: string; description: string; logo: string; accent: string };

export const brandDefaults: BrandSettings = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Boardly",
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() || "Simple, shareable task boards for getting things done together.",
  description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION?.trim() || "A calm shared workspace for tasks, notes, and team progress.",
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO?.trim() || "/icon.png",
  accent: process.env.NEXT_PUBLIC_BRAND_ACCENT?.trim() || "#635bff",
};

export function getBrand(): BrandSettings {
  return getBrandSettings(brandDefaults);
}

export const brand = brandDefaults;
