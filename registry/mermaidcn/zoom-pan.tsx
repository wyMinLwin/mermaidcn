"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
  /**
   * If true, disables CSS transitions for immediate updates (e.g., during wheel/drag).
   * If false, enables transitions for smooth steps (e.g., zoom buttons).
   */
  isImmediate: boolean;
}

export interface ZoomPanProps {
  /** Content to render inside the zoomable/pannable canvas */
  children: React.ReactNode;
  /** Optional className for the outer container */
  className?: string;
  /** Minimum zoom scale (default: 0.1) */
  minScale?: number;
  /** Maximum zoom scale (default: 5) */
  maxScale?: number;
  /** Initial zoom scale (default: 1) */
  initialScale?: number;
  /** Zoom step per scroll tick (default: 0.1) */
  zoomStep?: number;
  /** Render-prop for zoom controls UI */
  controls?: (api: {
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    centerView: () => void;
    scalePercent: number;
  }) => React.ReactNode;
  isLoading?: boolean;
  loadingFallback?: React.ReactNode;
}

export function ZoomPan({
  children,
  className,
  minScale = 0.1,
  maxScale = 5,
  initialScale = 1,
  zoomStep = 0.1,
  controls,
  isLoading = false,
  loadingFallback,
}: ZoomPanProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [zoomPan, setZoomPan] = React.useState<ZoomPanState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
    isImmediate: false,
  });

  // Refs for gesture handling
  const [isDragging, setIsDragging] = React.useState(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const lastTranslateRef = React.useRef({ x: 0, y: 0 });

  // Momentum refs
  const velocityRef = React.useRef({ x: 0, y: 0 });
  const lastTimeRef = React.useRef(0);
  const rafRef = React.useRef<number>(null);

  const touchStartRef = React.useRef<{
    touches: { x: number; y: number }[];
    distance: number;
    center: { x: number; y: number };
    scale: number;
    translateX: number;
    translateY: number;
  } | null>(null);

  // Keep state in ref for event handlers
  const zoomPanRef = React.useRef(zoomPan);
  React.useEffect(() => {
    zoomPanRef.current = zoomPan;
  }, [zoomPan]);

  // -- Momentum Panning Logic --

  const startMomentum = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = () => {
      const { x: vx, y: vy } = velocityRef.current;
      if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) {
        return; // Stop when velocity is low
      }

      setZoomPan((prev) => ({
        ...prev,
        translateX: prev.translateX + vx,
        translateY: prev.translateY + vy,
        isImmediate: true,
      }));

      // Friction
      velocityRef.current = { x: vx * 0.95, y: vy * 0.95 };
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const stopMomentum = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };
  };

  // -- Zoom Control Helpers (Center Zoom) --

  const getContainerCenter = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  };

  const applyZoomToPoint = (delta: number, point: { x: number; y: number }) => {
    stopMomentum();
    setZoomPan((prev) => {
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, prev.scale + delta),
      );
      const ratio = newScale / prev.scale;

      // Zoom around the point (relative to container)
      const newTranslateX = point.x - (point.x - prev.translateX) * ratio;
      const newTranslateY = point.y - (point.y - prev.translateY) * ratio;

      return {
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
        isImmediate: false, // Smooth transition for buttons
      };
    });
  };

  const zoomIn = React.useCallback(() => {
    applyZoomToPoint(zoomStep, getContainerCenter());
  }, [maxScale, zoomStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoomOut = React.useCallback(() => {
    applyZoomToPoint(-zoomStep, getContainerCenter());
  }, [minScale, zoomStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetZoom = React.useCallback(() => {
    stopMomentum();
    setZoomPan({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
      isImmediate: false, // Smooth return to center
    });
  }, [initialScale]);

  const centerView = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use the first child as the content to center
    const content = container.firstElementChild as HTMLElement;
    if (!content) return;

    const contentWidth = content.scrollWidth;
    const contentHeight = content.scrollHeight;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    // Calculate scale to fit with padding
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const fitScale = Math.min(
      maxScale,
      Math.max(minScale, Math.min(scaleX, scaleY)),
    );

    // Calculate center
    const newTranslateX = (containerWidth - contentWidth * fitScale) / 2;
    const newTranslateY = (containerHeight - contentHeight * fitScale) / 2;

    stopMomentum();
    setZoomPan({
      scale: fitScale,
      translateX: newTranslateX,
      translateY: newTranslateY,
      isImmediate: false,
    });
  }, [maxScale, minScale]);

  const scalePercent = Math.round(zoomPan.scale * 100);

  // -- Mouse Panning (Window-level listeners) --

  React.useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      // Calculate velocity for momentum (pixels per frame approx)
      if (dt > 0) {
        velocityRef.current = {
          x: e.movementX,
          y: e.movementY,
        };
      }

      setZoomPan((prev) => ({
        ...prev,
        translateX: lastTranslateRef.current.x + dx,
        translateY: lastTranslateRef.current.y + dy,
        isImmediate: true,
      }));
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
      startMomentum();
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Middle or Left click only
      if (isLoading) return;
      if (e.button !== 0 && e.button !== 1) return;

      e.preventDefault();
      stopMomentum(); // Stop any existing coasting
      setIsDragging(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      lastTranslateRef.current = {
        x: zoomPanRef.current.translateX,
        y: zoomPanRef.current.translateY,
      };
      lastTimeRef.current = performance.now();
      velocityRef.current = { x: 0, y: 0 };

      // Immediate mode for dragging
      setZoomPan((prev) => ({ ...prev, isImmediate: true }));
    },
    [isLoading],
  );

  // -- Touch Handling --

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isLoading) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopMomentum();

      const rect = container.getBoundingClientRect();
      // Mouse position relative to container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoomPan((prev) => {
        // Normalize wheel delta for consistent zoom across devices
        // For standard mouse wheel, deltaY is usually around +/- 100
        // For trackpads, it can be small float values.
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 40; // Line mode
        if (e.deltaMode === 2) delta *= 800; // Page mode

        const ZOOM_SENSITIVITY = 0.002;
        const scaleFactor = Math.exp(-delta * ZOOM_SENSITIVITY);

        const newScale = Math.min(
          maxScale,
          Math.max(minScale, prev.scale * scaleFactor),
        );

        // Calculate new translation to zoom towards mouse pointer
        const ratio = newScale / prev.scale;
        const newTranslateX = mouseX - (mouseX - prev.translateX) * ratio;
        const newTranslateY = mouseY - (mouseY - prev.translateY) * ratio;

        return {
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
          isImmediate: true,
        };
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      stopMomentum();
      const zp = zoomPanRef.current;

      // Single touch - Pan
      if (e.touches.length === 1) {
        touchStartRef.current = {
          touches: [{ x: e.touches[0].clientX, y: e.touches[0].clientY }],
          distance: 0,
          center: { x: 0, y: 0 },
          scale: zp.scale,
          translateX: zp.translateX,
          translateY: zp.translateY,
        };
      }
      // Multi touch - Pinch Zoom
      else if (e.touches.length === 2) {
        e.preventDefault();
        const center = getTouchCenter(e.touches);

        touchStartRef.current = {
          touches: [
            { x: e.touches[0].clientX, y: e.touches[0].clientY },
            { x: e.touches[1].clientX, y: e.touches[1].clientY },
          ],
          distance: getTouchDistance(e.touches),
          center,
          scale: zp.scale,
          translateX: zp.translateX,
          translateY: zp.translateY,
        };
      }
      setZoomPan((prev) => ({ ...prev, isImmediate: true }));
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const rect = container.getBoundingClientRect();

      // Pan
      if (
        e.touches.length === 1 &&
        touchStartRef.current.touches.length === 1
      ) {
        const dx = e.touches[0].clientX - touchStartRef.current.touches[0].x;
        const dy = e.touches[0].clientY - touchStartRef.current.touches[0].y;
        setZoomPan({
          scale: touchStartRef.current.scale,
          translateX: touchStartRef.current.translateX + dx,
          translateY: touchStartRef.current.translateY + dy,
          isImmediate: true,
        });
      }
      // Pinch Zoom
      else if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
        e.preventDefault();
        const newDist = getTouchDistance(e.touches);
        const newCenter = getTouchCenter(e.touches);

        const scaleRatio = newDist / touchStartRef.current.distance;
        const newScale = Math.min(
          maxScale,
          Math.max(minScale, touchStartRef.current.scale * scaleRatio),
        );

        // Calculate Translation
        const oldScale = touchStartRef.current.scale;
        const oldTranslateX = touchStartRef.current.translateX;
        const oldTranslateY = touchStartRef.current.translateY;

        const oldCenterXRel = touchStartRef.current.center.x - rect.left;
        const oldCenterYRel = touchStartRef.current.center.y - rect.top;

        const newCenterXRel = newCenter.x - rect.left;
        const newCenterYRel = newCenter.y - rect.top;

        // Point on content
        const contentX = (oldCenterXRel - oldTranslateX) / oldScale;
        const contentY = (oldCenterYRel - oldTranslateY) / oldScale;

        const newTranslateX = newCenterXRel - contentX * newScale;
        const newTranslateY = newCenterYRel - contentY * newScale;

        setZoomPan({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
          isImmediate: true,
        });
      }
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [minScale, maxScale, zoomStep, isLoading]);

  return (
    <div className={cn("flex flex-col", className)}>
      {/* eslint-disable-next-line react-hooks/refs */}
      {controls?.({ zoomIn, zoomOut, resetZoom, centerView, scalePercent })}
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            transform: `translate(${zoomPan.translateX}px, ${zoomPan.translateY}px) scale(${zoomPan.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
            transition: zoomPan.isImmediate
              ? "none"
              : "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          className="inline-flex origin-top-left [&_svg]:max-w-full"
        >
          {children}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
            {loadingFallback || (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Standalone hook for custom zoom/pan implementations */
export function useZoomPan(initialScale = 1) {
  const [zoomPan, setZoomPan] = React.useState<ZoomPanState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
    isImmediate: false,
  });

  const zoomIn = React.useCallback(() => {
    setZoomPan((prev) => ({
      ...prev,
      scale: Math.min(5, prev.scale + 0.1),
      isImmediate: false,
    }));
  }, []);

  const zoomOut = React.useCallback(() => {
    setZoomPan((prev) => ({
      ...prev,
      scale: Math.max(0.1, prev.scale - 0.1),
      isImmediate: false,
    }));
  }, []);

  const resetZoom = React.useCallback(() => {
    setZoomPan({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
      isImmediate: false,
    });
  }, [initialScale]);

  return {
    zoomPan,
    setZoomPan,
    zoomIn,
    zoomOut,
    resetZoom,
    scalePercent: Math.round(zoomPan.scale * 100),
  };
}
