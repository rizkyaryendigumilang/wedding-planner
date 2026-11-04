import { useEffect } from "react";

/**
 * Mengunci scroll body saat modal / drawer / lightbox sedang terbuka.
 * Menghitung selisih scrollbar desktop agar lebar layout tidak bergeser (layout shift).
 */
export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}

/**
 * Hook terpadu untuk aksesibilitas modal & dialog:
 * 1. Mengunci scroll background (useBodyScrollLock) untuk mencegah scroll bleed.
 * 2. Menutup modal saat tombol 'Escape' ditekan.
 */
export function useModalA11y(isOpen, onClose) {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen || typeof onClose !== "function") return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
}
