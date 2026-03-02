"use client";

import { ThemeProvider } from "./ThemeProvider";
import { TabNav } from "./TabNav";

/**
 * Client-side shell that wraps the ThemeProvider and navigation.
 * This is a single client boundary imported by the server layout,
 * which helps Turbopack resolve the React Client Manifest correctly.
 */
export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TabNav />
      <main className="min-h-screen pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </ThemeProvider>
  );
}
