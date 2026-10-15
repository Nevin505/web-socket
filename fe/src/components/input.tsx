
import type { InputHTMLAttributes } from "react";

type InputVariant =
  | "default"
  | "outlined"
  | "filled"
  | "error"
  | "success";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: InputVariant;
  errorMessage?: string;
}

const Input = ({
  id,
  label,
  variant = "default",
  errorMessage,
  className = "",
  ...props
}: InputProps) => {
  const baseStyles =
    "w-full rounded-md px-3 py-2 outline-none transition focus:ring-2";

  const variants: Record<InputVariant, string> = {
    default:
      "border border-gray-300 focus:border-blue-500 focus:ring-blue-100",
    outlined:
      "border-2 border-gray-500 focus:border-blue-600 focus:ring-blue-100",
    filled:
      "border border-transparent bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-100",
    error:
      "border border-red-500 focus:border-red-600 focus:ring-red-100",
    success:
      "border border-green-500 focus:border-green-600 focus:ring-green-100",
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        id={id}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        aria-invalid={variant === "error"}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
      />

      {errorMessage && (
        <p id={`${id}-error`} className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Input;
