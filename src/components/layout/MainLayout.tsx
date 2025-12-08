import type { ReactNode } from 'react';

import { Header } from './Header';
import { Navigation } from './Navigation';

import type { NavigationTab } from './Navigation';

interface MainLayoutProps {
    currentTab: NavigationTab;
    onTabChange: (tab: NavigationTab) => void;
    children: ReactNode;
}

export function MainLayout({ currentTab, onTabChange, children }: MainLayoutProps) {
    return (
        <div className="h-screen flex flex-col bg-background text-foreground">
            <Header />
            <div className="h-2" />
            <Navigation currentTab={currentTab} onTabChange={onTabChange} />

            <main className="flex-1 min-h-0">
                <div className="h-full mx-auto w-[98%] 2xl:w-[80%] px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 landscape:py-4 mobile-landscape:py-3">
                    {children}
                </div>
            </main>
        </div>
    );
}