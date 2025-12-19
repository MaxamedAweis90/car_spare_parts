"use client";

import ClickAwayListener from "@mui/material/ClickAwayListener";
import type { ClickAwayListenerProps } from "@mui/material/ClickAwayListener";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

type ClickAwaySurfaceProps = PropsWithChildren<
  ComponentPropsWithoutRef<"div"> & {
    onClose: () => void;
    disabled?: boolean;
    mouseEvent?: ClickAwayListenerProps["mouseEvent"];
    touchEvent?: ClickAwayListenerProps["touchEvent"];
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
  const appliedMouseEvent: ClickAwayListenerProps["mouseEvent"] = disabled ? false : mouseEvent;
  const appliedTouchEvent: ClickAwayListenerProps["touchEvent"] = disabled ? false : touchEvent;

  return (
    <ClickAwayListener
      onClickAway={() => {
        if (!disabled) {
          onClose();
        }
      }}
      mouseEvent={appliedMouseEvent}
      touchEvent={appliedTouchEvent}
    >
      <div {...rest}>{children}</div>
    </ClickAwayListener>
  );
}
