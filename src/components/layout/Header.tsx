import { ThemeToggle } from "@/components/layout";
import { DATABASE_VERSION } from "@/types/constants";

/**
 * 应用头部组件
 * 显示应用标题、Logo和主题切换按钮
 */
export function Header() {
  const appVersion = __APP_VERSION__;

  return (
    <header className="from-primary to-primary/70 text-primary-foreground border-b bg-linear-to-r">
      <div className="mobile-landscape:py-2 mx-auto w-[98%] px-4 py-4 sm:px-6 sm:py-5 md:px-8 lg:px-10 2xl:w-[80%] landscape:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/set.png"
              alt="Charm"
              className="mobile-landscape:h-5 mobile-landscape:w-5 h-6 w-6 sm:h-8 sm:w-8"
            />
            <div className="flex items-center gap-2">
              <h1 className="mobile-landscape:text-lg text-xl font-bold sm:text-2xl">
                MHWS 配装器
              </h1>
              <p className="mobile-landscape:hidden text-xs sm:text-sm">
                Monster Hunter Wilds - Set Builder
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-primary-foreground/80 text-right text-xs">
              <div>
                Created by{" "}
                <a href="https://github.com/mooonseeker" className="underline">
                  Moonseeker
                </a>{" "}
                © 2025
              </div>
              <div className="text-xs">
                APP v{appVersion} | DB v{DATABASE_VERSION}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
