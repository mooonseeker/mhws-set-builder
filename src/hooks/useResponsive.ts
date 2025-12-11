import { useMediaQuery } from "./useMediaQuery";
import { useOrientation } from "./useOrientation";

import type { OrientationType } from "./useOrientation";
export type DeviceType = "mobile" | "tablet" | "desktop";
export type ScreenSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ResponsiveState {
  // 设备类型
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // 屏幕尺寸
  screenSize: ScreenSize;

  // 方向
  orientation: OrientationType;
  isPortrait: boolean;
  isLandscape: boolean;

  // 组合判断
  isMobileLandscape: boolean;
  isMobilePortrait: boolean;
  isTabletLandscape: boolean;
  isTabletPortrait: boolean;
}

/**
 * 综合响应式状态Hook
 *
 * @returns {ResponsiveState} 完整的响应式状态
 *
 * @example
 * const { isMobile, isLandscape, deviceType } = useResponsive();
 *
 * if (isMobileLandscape) {
 *   // 手机横屏特定布局
 * }
 */
export function useResponsive(): ResponsiveState {
  const { orientation, isPortrait, isLandscape } = useOrientation();

  // 设备类型检测
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // 屏幕尺寸检测
  const isSm = useMediaQuery("(min-width: 640px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const is2Xl = useMediaQuery("(min-width: 1536px)");

  // 确定设备类型
  const deviceType: DeviceType = isMobile
    ? "mobile"
    : isTablet
      ? "tablet"
      : "desktop";

  // 确定屏幕尺寸
  let screenSize: ScreenSize = "sm";
  if (is2Xl) screenSize = "2xl";
  else if (isXl) screenSize = "xl";
  else if (isLg) screenSize = "lg";
  else if (isMd) screenSize = "md";
  else if (isSm) screenSize = "sm";

  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,

    screenSize,

    orientation,
    isPortrait,
    isLandscape,

    isMobileLandscape: isMobile && isLandscape,
    isMobilePortrait: isMobile && isPortrait,
    isTabletLandscape: isTablet && isLandscape,
    isTabletPortrait: isTablet && isPortrait,
  };
}
