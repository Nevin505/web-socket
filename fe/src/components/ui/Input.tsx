import type { InputHTMLAttributes, ReactElement } from "react";

export type InputVariant =
  | "default"
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
  startIcon, endIcon,
  variant = "default",

  className = "",
  ...props
}: InputProps) => {
  const baseStyles =
    "w-full rounded-xl px-3.5 py-2.5 outline-none transition-all text-sm focus:ring-2";

  const variants: Record<InputVariant, string> = {
    default:
      "border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-100",
    outlined:
      "border-2 border-gray-500 bg-white text-gray-900 focus:border-blue-600 focus:ring-blue-100",
    filled:
      "border border-transparent bg-gray-100 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-blue-100",
    error:
      "border border-red-500 bg-red-50/30 text-gray-900 focus:border-red-600 focus:ring-red-100",
    success:
      "border border-emerald-500 bg-emerald-50/30 text-gray-900 focus:border-emerald-600 focus:ring-emerald-100",
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {startIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{startIcon}</div>}
        <input
          {...props}
          id={id}
          className={`${baseStyles} ${variants[variant]} ${className}`}
          aria-invalid={variant === "error"}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
        />
        {endIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{endIcon}</div> }
      </div>
      {errorMessage && (
        <p id={`${id}-error`} className="text-xs text-red-500 mt-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Input;
