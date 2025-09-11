import React from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  if (!open) return null;

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={handleBackdrop}
    >
      <div className="w-[120vw] max-w-lg rounded-xl border border-white/10 bg-zinc-900 p-5 text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-white/70">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white/80 hover:bg-white/15"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );

  const canPortal = typeof document !== "undefined" && !!document.body;
  return canPortal ? createPortal(content, document.body) : content;
}

export default Modal;
