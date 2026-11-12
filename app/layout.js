// app/layout.js
//
// Root layout: wraps every page. Sets <html>, <body>, fonts, and metadata.

import "./globals.css";

export const metadata = {
  title: "Aquaculture Site Selector",
  description:
    "Interactive marine site evaluation using open environmental data.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts: Fraunces (display serif) + Inter Tight (body) + JetBrains Mono (data) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
