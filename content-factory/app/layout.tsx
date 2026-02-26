import "./globals.css";

export const metadata = {
  title: "Content Factory — Финальная Архитектура",
  description: "Instagram Content Factory на базе Reels + AI — финальная архитектура.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

