"use client";

import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";
type ButtonRounded = "default" | "full" | "none";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  href?: string;
  target?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  rounded = "default",
  href,
  target,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  // Variant styles
  const variants = {
    primary:
      "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110 border border-transparent shadow-sm",
    secondary:
      "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:brightness-110 border border-transparent shadow-sm",
    outline:
      "bg-transparent border-2 border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
    ghost:
      "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
    link: "bg-transparent text-[var(--color-primary)] hover:underline p-0 h-auto",
  };

  // Size styles
  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-8 py-3 gap-2.5",
  };

  // Rounded styles
  const roundness = {
    default: "rounded-md",
    full: "rounded-full",
    none: "rounded-none",
  };

  // Combine classes
  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${variant !== "link" ? sizes[size] : "text-sm gap-1"} 
    ${roundness[rounded]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  // Content with icons and loading state
  const content = (
    <>
      {isLoading && (
        <i className="fa-solid fa-circle-notch fa-spin text-current"></i>
      )}
      {!isLoading && leftIcon && (
        <span className="flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="flex items-center">{rightIcon}</span>
      )}
    </>
  );

  // Render as Link if href is present
  if (href) {
    return (
      <Link
        href={href}
        target={target}
        className={combinedClassName}
        aria-disabled={disabled || isLoading}
      >
        {content}
      </Link>
    );
  }

  // Render as Button
  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
}

