import { useEffect, useState } from "react";

export type OrientationType = "portrait" | "landscape";

export interface OrientationState {
  orientation: OrientationType;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * 检测屏幕方向的自定义Hook
 *
 * @returns {OrientationState} 屏幕方向状态
 *
 * @example
 * const { orientation, isLandscape } = useOrientation();
 *
 * if (isLandscape) {
 *   // 横屏特定逻辑
 * }
 */
export function useOrientation(): OrientationState {
  const getOrientation = (): OrientationState => {
    // 优先使用 Screen Orientation API
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

    // 降级方案：使用窗口尺寸判断
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

    // 监听方向变化事件
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener(
        "change",
        handleOrientationChange,
      );
    }

    // 监听窗口大小变化（降级方案）
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
