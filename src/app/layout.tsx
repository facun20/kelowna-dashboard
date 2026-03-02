import type { Metadata } from "next";
import Script from "next/script";
import { ClientShell } from "@/components/layout/ClientShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kelowna Intel \u2014 Civic Intelligence Dashboard",
  description:
    "Real-time intelligence on Kelowna's economy, development, council decisions, crime, and community sentiment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('kelowna-theme');
                  if (t === 'dark') document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ClientShell>{children}</ClientShell>
        <Script
          src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
          data-name="bmc-button"
          data-slug="kelownaintelhub"
          data-color="#FFDD00"
          data-emoji=""
          data-font="Cookie"
          data-text="Buy me a coffee"
          data-outline-color="#000000"
          data-font-color="#000000"
          data-coffee-color="#ffffff"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
