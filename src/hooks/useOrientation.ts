/**
 * @fileoverview Custom hook for detecting screen orientation.
 */

import { useEffect, useState } from "react";

export type OrientationType = "portrait" | "landscape";

export interface OrientationState {
  orientation: OrientationType;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Custom hook for detecting screen orientation.
 *
 * @returns The screen orientation state.
 *
 * @example
 * const { orientation, isLandscape } = useOrientation();
 *
 * if (isLandscape) {
 *   // Logic specific to landscape mode
 * }
 */
export function useOrientation(): OrientationState {
  const getOrientation = (): OrientationState => {
    // Prefer the Screen Orientation API
    if (window.screen?.orientation) {
      const type = window.screen.orientation.type;
      const angle = window.screen.orientation.angle;
      const isLandscape = type.includes("landscape");

      return {
        orientation: isLandscape ? "landscape" : "portrait",
        angle,
        isPortrait: !isLandscape,
        isLandscape,
      };
    }

    // Fallback: use window dimensions
    const isLandscape = window.innerWidth > window.innerHeight;

    return {
      orientation: isLandscape ? "landscape" : "portrait",
      angle: 0,
      isPortrait: !isLandscape,
      isLandscape,
    };
  };

  const [orientation, setOrientation] =
    useState<OrientationState>(getOrientation);

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    // Listen for orientation changes
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener(
        "change",
        handleOrientationChange,
      );
    }

    // Listen for window resize as a fallback
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener(
          "change",
          handleOrientationChange,
        );
      }
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return orientation;
}
