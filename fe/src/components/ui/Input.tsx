import type { InputHTMLAttributes, ReactElement } from "react";

export type InputVariant =
  | "default"
  | "dark"
  | "outlined"
  | "filled"
  | "error"
  | "success";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: InputVariant;
  errorMessage?: string;
  startIcon?: ReactElement;
  endIcon?: ReactElement;
}

export const Input = ({
  id,
  label,
  errorMessage,
  startIcon,
  endIcon,
  variant = "default",
  className = "",
  ...props
}: InputProps) => {
  const baseStyles =
    "w-full rounded-xl py-3 outline-none transition-all text-sm focus:ring-2";

  const variants: Record<InputVariant, string> = {
    default:
      "border border-dark-input-border bg-dark-input text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary/25",
    dark:
      "border border-dark-input-border bg-dark-input text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary/25",
    outlined:
      "border-2 border-slate-600 bg-dark-input text-white focus:border-primary focus:ring-primary/25",
    filled:
      "border border-transparent bg-dark-input/80 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary/25",
    error:
      "border border-red-500 bg-red-950/20 text-white focus:border-red-500 focus:ring-red-500/20",
    success:
      "border border-emerald-500 bg-emerald-950/20 text-white focus:border-emerald-500 focus:ring-emerald-500/20",
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {startIcon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {startIcon}
          </div>
        )}
        <input
          {...props}
          id={id}
          className={`${baseStyles} ${startIcon ? "pl-10" : "px-4"} ${endIcon ? "pr-10" : "px-4"} ${variants[variant]} ${className}`}
          aria-invalid={variant === "error"}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
        />
        {endIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {endIcon}
          </div>
        )}
      </div>
      {errorMessage && (
        <p id={`${id}-error`} className="mt-0.5 text-xs text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Input;
