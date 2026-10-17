export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://quddus.diaspafra.org").replace(/\/$/, "");
export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

// Spellings of the name used across profiles, so search engines link them to one person.
export const NAME_VARIANTS = ["Raheem Quddus", "Raheem R. Quddus", "Quddos"];
