import { useState } from "react";

import { CharmManager } from "@/components/charms";
import { DatabaseManager } from "@/components/database";
import { MainLayout } from "@/components/layout";
import { SetBuilder } from "@/components/set-builder";
import { Settings } from "@/components/settings";
import { AppProvider } from "@/contexts";
import { SetBuilderProvider } from "@/contexts/SetBuilderContext";

import type { NavigationTab } from "@/components/layout";

function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>("database");

  const renderContent = () => {
    switch (currentTab) {
      case "database":
        return <DatabaseManager />;
      case "charms":
        return <CharmManager />;
      case "set-builder":
        return (
          <SetBuilderProvider>
            <SetBuilder />
          </SetBuilderProvider>
        );
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <AppProvider>
      <MainLayout currentTab={currentTab} onTabChange={setCurrentTab}>
        {renderContent()}
      </MainLayout>
    </AppProvider>
  );
}

export default App;
