export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Boardly",
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() || "Simple, shareable task boards for getting things done together.",
  description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION?.trim() || "A calm shared workspace for tasks, notes, and team progress.",
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO?.trim() || "/icon.png",
  accent: process.env.NEXT_PUBLIC_BRAND_ACCENT?.trim() || "#635bff",
};
