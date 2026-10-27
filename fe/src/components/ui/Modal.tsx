import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./icons";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  headerCustom?: ReactNode;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  headerCustom,
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!mounted || !isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className={`relative w-full ${SIZE_CLASSES[size]} overflow-hidden rounded-3xl bg-[#131929] border border-dark-card-border text-white shadow-2xl ring-1 ring-white/10 transition-all animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Custom Header or Default Header */}
        {headerCustom ? (
          headerCustom
        ) : title ? (
          <div
            className={`flex items-center justify-between border-b border-dark-card-border px-6 py-4 ${headerClassName}`}
          >
            <div className="flex items-center gap-3">
              {icon && <div className="shrink-0">{icon}</div>}
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {title}
                </h2>
                {description && (
                  <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors focus:outline-none cursor-pointer"
                aria-label="Close dialog"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : null}

        {/* Modal Body */}
        <div className={`p-6 ${bodyClassName}`}>{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-dark-card-border bg-[#0f1524] px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
