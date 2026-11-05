"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  icon?: "trash" | "logout" | "warning";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  icon = "trash",
  isLoading = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const root = document.documentElement;
    const scrollY = window.scrollY;
    const originalHref = window.location.href;
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
      overflow: body.style.overflow,
    };
    const previousRootStyles = {
      overflow: root.style.overflow,
      overscrollBehavior: root.style.overscrollBehavior,
    };
    const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";

    return () => {
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.width = previousBodyStyles.width;
      body.style.paddingRight = previousBodyStyles.paddingRight;
      body.style.overflow = previousBodyStyles.overflow;
      root.style.overflow = previousRootStyles.overflow;
      root.style.overscrollBehavior = previousRootStyles.overscrollBehavior;
      if (window.location.href === originalHref) window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const iconColors = {
    danger: { bg: "#FCE7EC", color: "#C8265A" },
    warning: { bg: "#FEF3D6", color: "#B4531E" },
    primary: { bg: "#E6F6F2", color: "#0E7C66" },
  }[variant];

  const confirmColors = {
    danger: "bg-[#C8265A] text-white",
    warning: "bg-[#FFC83D] text-[#0F1E3D]",
    primary: "bg-[#0E7C66] text-white",
  }[variant];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(10, 21, 48, 0.72)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative z-10 max-h-[calc(100svh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-[28px] border-[2.5px] border-ink p-6 text-ink shadow-[5px_5px_0_#0F1E3D] animate-in fade-in duration-100"
        style={{ backgroundColor: "#FFFBF2" }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center border-[2px] border-ink mb-4 shadow-[2px_2px_0_#0F1E3D]"
            style={{ backgroundColor: iconColors.bg, width: 52, height: 52 }}
          >
            {icon === "trash" && <Trash2 className="w-5 h-5" style={{ color: iconColors.color }} />}
            {icon === "logout" && <LogOut className="w-5 h-5 ml-0.5" style={{ color: iconColors.color }} />}
            {icon === "warning" && <AlertTriangle className="w-5 h-5" style={{ color: iconColors.color }} />}
          </div>

          <h3 className="font-bricolage font-black text-xl text-ink mb-1.5 leading-tight">
            {title}
          </h3>

          <p className="text-xs text-[#3F4B69] font-medium leading-relaxed mb-6">
            {description}
          </p>

          <div className="flex w-full gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 py-3 px-3 sm:px-4 rounded-full font-bold text-xs border-[2px] border-ink text-ink bg-white hover:bg-neutral-50 transition-colors shadow-[2px_2px_0_#0F1E3D] disabled:opacity-50 whitespace-nowrap"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`flex-1 py-3 px-3 sm:px-4 rounded-full font-bold text-xs border-[2px] border-ink flex items-center justify-center gap-1.5 transition-colors shadow-[2px_2px_0_#0F1E3D] disabled:opacity-50 whitespace-nowrap ${confirmColors}`}
            >
              {isLoading && <JaaymaLoader variant={variant === "warning" ? "mini-ink" : "mini"} size={28} />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
