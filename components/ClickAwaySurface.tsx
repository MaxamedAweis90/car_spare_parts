"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

type MouseEventOption = "onMouseDown" | "onMouseUp" | "onClick" | false;
type TouchEventOption = "onTouchStart" | "onTouchEnd" | false;

type ClickAwaySurfaceProps = PropsWithChildren<
  ComponentPropsWithoutRef<"div"> & {
    onClose: () => void;
    disabled?: boolean;
    mouseEvent?: MouseEventOption;
    touchEvent?: TouchEventOption;
  }
>;

export function ClickAwaySurface({
  children,
  onClose,
  disabled,
  mouseEvent = "onMouseDown",
  touchEvent = "onTouchStart",
  ...rest
}: ClickAwaySurfaceProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const mouseDomEvent = useMemo(() => {
    if (disabled || mouseEvent === false) return null;
    if (mouseEvent === "onMouseUp") return "mouseup" as const;
    if (mouseEvent === "onClick") return "click" as const;
    return "mousedown" as const;
  }, [disabled, mouseEvent]);

  const touchDomEvent = useMemo(() => {
    if (disabled || touchEvent === false) return null;
    if (touchEvent === "onTouchEnd") return "touchend" as const;
    return "touchstart" as const;
  }, [disabled, touchEvent]);

  useEffect(() => {
    if (disabled) return;
    if (typeof document === "undefined") return;

    const handler = (event: Event) => {
      const el = rootRef.current;
      if (!el) return;

      const target = event.target;
      if (!(target instanceof Node)) return;

      const composedPath = (event as Event & { composedPath?: () => EventTarget[] }).composedPath?.();
      if (composedPath && composedPath.includes(el)) return;

      // Only close when the click/touch is OUTSIDE the surface.
      if (el.contains(target)) return;
      onClose();
    };

    // Capture phase makes this resilient even if children stop propagation.
    if (mouseDomEvent) document.addEventListener(mouseDomEvent, handler, true);
    if (touchDomEvent) document.addEventListener(touchDomEvent, handler, true);

    return () => {
      if (mouseDomEvent) document.removeEventListener(mouseDomEvent, handler, true);
      if (touchDomEvent) document.removeEventListener(touchDomEvent, handler, true);
    };
  }, [disabled, mouseDomEvent, touchDomEvent, onClose]);

  return (
    <div ref={rootRef} {...rest}>
      {children}
    </div>
  );
}
