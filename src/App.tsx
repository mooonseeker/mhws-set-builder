/**
 * @fileoverview The main application component for MHWS Set Builder.
 * It orchestrates the main layout and renders different views based on the
 * selected navigation tab.
 */

import { useState } from "react";

import { CharmManager } from "@/components/charms";
import { DatabaseManager } from "@/components/database";
import { MainLayout, type NavigationTab } from "@/components/layout";
import { SetBuilder } from "@/components/set-builder";
import { MigrationReport, Settings } from "@/components/settings";
import { AppProvider } from "@/contexts";

function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>("set-builder");

  const renderContent = () => {
    switch (currentTab) {
      case "database":
        return <DatabaseManager />;
      case "charms":
        return <CharmManager />;
      case "set-builder":
        return <SetBuilder />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <AppProvider>
      <MigrationReport />
      <MainLayout currentTab={currentTab} onTabChange={setCurrentTab}>
        {renderContent()}
      </MainLayout>
    </AppProvider>
  );
}

export default App;
