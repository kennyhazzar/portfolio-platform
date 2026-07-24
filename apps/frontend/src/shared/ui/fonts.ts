import localFont from "next/font/local";

/**
 * Self-hosted variable fonts — the .ttf files under src/fonts are committed to the repo
 * (downloaded once from the fonts' own source, not fetched from Google/any CDN at build or
 * runtime). Each file is a single variable font covering its full weight range and both
 * Latin + Cyrillic, so one file per family is enough.
 */
export const displayFont = localFont({
  src: "../../fonts/Unbounded-Variable.ttf",
  variable: "--font-unbounded",
  weight: "200 900",
  display: "swap",
});

export const sansFont = localFont({
  src: "../../fonts/Onest-Variable.ttf",
  variable: "--font-onest",
  weight: "100 900",
  display: "swap",
});

export const monoFont = localFont({
  src: "../../fonts/JetBrainsMono-Variable.ttf",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
});
