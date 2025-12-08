import { ThemeToggle } from '@/components/layout';
import { DATABASE_VERSION } from '@/types/constants';

/**
 * 应用头部组件
 * 显示应用标题、Logo和主题切换按钮
 */
export function Header() {
    const appVersion = __APP_VERSION__;

    return (
        <header className="border-b bg-linear-to-r from-primary to-primary/70 text-primary-foreground">
            <div className="mx-auto w-[98%] 2xl:w-[80%] px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 landscape:py-3 mobile-landscape:py-2">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img src="/set.png" alt="Charm" className="h-6 w-6 sm:h-8 sm:w-8 mobile-landscape:h-5 mobile-landscape:w-5" />
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold mobile-landscape:text-lg">MHWS 配装器</h1>
                            <p className="text-xs sm:text-sm mobile-landscape:hidden">Monster Hunter Wilds - Set Builder</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-primary-foreground/80">
                            <div>Created by <a href="https://github.com/mooonseeker" className="underline">Moonseeker</a> © 2025</div>
                            <div className="text-xs">APP v{appVersion} | DB v{DATABASE_VERSION}</div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}