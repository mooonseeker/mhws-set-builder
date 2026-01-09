/**
 * @fileoverview MainLayout component that defines the overall structure of the application.
 */

import type { ReactNode } from "react";

import { Header } from "./Header";
import { Navigation, type NavigationTab } from "./Navigation";

/** Props for the MainLayout component. */
interface MainLayoutProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  children: ReactNode;
}

/**
 * The main layout wrapper for the application, including the header and navigation.
 */
export function MainLayout({
  currentTab,
  onTabChange,
  children,
}: MainLayoutProps) {
  return (
    <div className="bg-background text-foreground flex h-screen flex-col">
      <Header />
      <div className="h-2" />
      <Navigation currentTab={currentTab} onTabChange={onTabChange} />

      <main className="min-h-0 flex-1">
        <div className="mobile-landscape:py-3 mx-auto h-full w-[98%] px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 2xl:w-[80%] landscape:py-4">
          {children}
        </div>
      </main>
    </div>
  );
}
