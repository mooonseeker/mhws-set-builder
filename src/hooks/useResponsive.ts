/**
 * @fileoverview Comprehensive responsive state hook.
 */

import { useMediaQuery } from "./useMediaQuery";
import { useOrientation, type OrientationType } from "./useOrientation";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type ScreenSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ResponsiveState {
  // Device Type
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Screen Size
  screenSize: ScreenSize;

  // Orientation
  orientation: OrientationType;
  isPortrait: boolean;
  isLandscape: boolean;

  // Combined checks
  isMobileLandscape: boolean;
  isMobilePortrait: boolean;
  isTabletLandscape: boolean;
  isTabletPortrait: boolean;
}

/**
 * Comprehensive hook for responsive state.
 *
 * @returns The complete responsive state.
 *
 * @example
 * const { isMobile, isLandscape, deviceType } = useResponsive();
 *
 * if (isMobileLandscape) {
 *   // Layout for mobile landscape
 * }
 */
export function useResponsive(): ResponsiveState {
  const { orientation, isPortrait, isLandscape } = useOrientation();

  // Device type detection
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Screen size detection
  const isSm = useMediaQuery("(min-width: 640px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const is2Xl = useMediaQuery("(min-width: 1536px)");

  // Determine device type
  const deviceType: DeviceType = isMobile
    ? "mobile"
    : isTablet
      ? "tablet"
      : "desktop";

  // Determine screen size
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
