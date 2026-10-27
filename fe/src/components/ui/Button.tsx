import type { ButtonHTMLAttributes } from "react";
import { SpinnerIcon } from "./icons";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "success"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

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
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  const widthClass = className.includes("w-") ? "" : "w-full";

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
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
