/**
 * Konfigurasi Gerak & Micro-Interactions (Sorvo & Apple Motion Architecture)
 * Sesuai prinsip:
 * - Asymmetric Easing: enter snappy (expo.out) & exit cepat berakselerasi (power.in)
 * - Decoupled Scrim (Backdrop fade terpisah)
 * - Spatial Origin support
 */

export const EASE_EXPO_OUT = [0.16, 1, 0.3, 1];
export const EASE_POWER_IN = [0.7, 0, 0.84, 0];

/**
 * Variasi animasi backdrop (scrim) terpisah: fade cepat & decoupled.
 */
export const modalBackdropVariants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.20,
      ease: EASE_POWER_IN,
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: EASE_EXPO_OUT,
    },
  },
};

/**
 * Variasi animasi dialog modal dengan timing asimetris & dukungan spatial origin.
 * Buka: expo.out (0.48s) - snappy glide lembut
 * Tutup: power.in (0.18s) - cepat keluar tanpa menahan pengguna
 */
export const modalDialogVariants = {
  hidden: (origin) => ({
    opacity: 0,
    scale: 0.94,
    y: 8,
    transformOrigin: origin || "center center",
    transition: {
      duration: 0.18,
      ease: EASE_POWER_IN,
    },
  }),
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transformOrigin: "center center",
    transition: {
      duration: 0.48,
      ease: EASE_EXPO_OUT,
    },
  },
};
