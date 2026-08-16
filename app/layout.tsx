import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

const themeInitScript = `
  try {
    var savedTheme = localStorage.getItem("verso-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  } catch (_) {
    document.documentElement.dataset.theme = "light";
  }
`;

export const metadata: Metadata = {
  title: "Verso | Arsip bacaan pribadi",
  description: "Simpan, cari, dan baca kembali artikel serta paper dari satu tempat."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
