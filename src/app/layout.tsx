import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { BuyMeCoffee } from "@/components/layout/BuyMeCoffee";
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

        {/* Google Fonts — Cookie for BMC button */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cookie&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ClientShell>{children}</ClientShell>
        <BuyMeCoffee />
      </body>
    </html>
  );
}
