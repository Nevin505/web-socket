import type { ButtonHTMLAttributes } from "react";
import { SpinnerIcon } from "./icons";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "success"
  | "ghost"
  | "soft";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = ({
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) => {
  const isIcon = size === "icon" || size === "icon-sm";

  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.99] focus:ring-primary",
    secondary:
      "bg-dark-input border border-dark-input-border text-slate-200 hover:bg-dark-input-hover active:scale-[0.99] focus:ring-secondary",
    outline:
      "border border-dark-input-border bg-transparent text-slate-300 hover:bg-white/5 active:scale-[0.99] focus:ring-primary",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    ghost:
      "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 focus:ring-slate-500",
    soft:
      "border border-primary/30 bg-primary/10 text-primary-300 hover:bg-primary/20 active:scale-[0.99] focus:ring-primary",
  };

  const sizes: Record<ButtonSize, string> = {
    xs: "px-2.5 py-1 text-xs rounded-lg gap-1",
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-3 text-sm rounded-xl gap-2",
    lg: "px-6 py-3.5 text-base rounded-xl gap-2",
    icon: "h-10 w-10 p-0 rounded-xl",
    "icon-sm": "h-8 w-8 p-0 rounded-lg",
  };

  let widthClass = "";
  if (fullWidth === true) {
    widthClass = "w-full";
  } else if (fullWidth === false || isIcon) {
    widthClass = "";
  } else {
    widthClass = className.includes("w-") ? "" : "w-full";
  }

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={`${widthClass} ${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <SpinnerIcon className="h-4 w-4" />
          {!isIcon && <span>Processing...</span>}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
