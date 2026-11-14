/**
 * Konfigurasi Gerak & Micro-Interactions (Apple Motion & WWDC Fluid Interfaces)
 * Sesuai prinsip Apple:
 * - Fluid & Interruptible: Menggunakan fisika pegas (spring physics) yang dapat
 *   di-interupsi dan dibalikkan arahnya seketika tanpa hentakan atau diskontinuitas kecepatan.
 * - Critically Damped (damping 1.0): Gerakan stabil, anggun, tanpa goyangan/overshoot berlebih.
 * - Decoupled Scrim: Animasi latar backdrop terpisah secara independen.
 * - Spatial Origin: Transform origin berlabuh pada pemicu interaksi.
 */

export const EASE = [0.22, 1, 0.36, 1];
export const EASE_EXPO_OUT = [0.16, 1, 0.3, 1];
export const EASE_POWER_IN = [0.7, 0, 0.84, 0];

/**
 * Preset Pegas Standar Apple WWDC (Framer Motion / Motion Specs)
 */
export const APPLE_SPRINGS = {
  // Default UI Spring: Critically damped, tanpa pantulan, sangat responsif (~0.34s)
  default: {
    type: "spring",
    stiffness: 380,
    damping: 32,
    mass: 0.8,
  },
  // Snappy Spring: Untuk elemen kecil, tombol, popover, dan indikator aktif
  snappy: {
    type: "spring",
    stiffness: 440,
    damping: 34,
    mass: 0.7,
  },
  // Sheet & Drawer: Sedikit lebih berat dengan redaman halus untuk panel besar
  sheet: {
    type: "spring",
    stiffness: 320,
    damping: 30,
    mass: 0.9,
  },
  // Momentum Interaction: Sedikit pantulan (bounce ~0.15) hanya untuk interaksi lempar/flick
  momentum: {
    type: "spring",
    stiffness: 340,
    damping: 24,
    mass: 0.8,
  },
};

/**
 * Umpan balik sentuhan fisik mikro (Physical Press Feedback)
 */
export const TAP_FEEDBACK = {
  scale: 0.97,
  transition: { duration: 0.1, ease: "easeOut" },
};

/**
 * Variasi animasi backdrop (scrim) terpisah: fade cepat & decoupled.
 */
export const modalBackdropVariants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: EASE_POWER_IN,
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.24,
      ease: EASE_EXPO_OUT,
    },
  },
};

/**
 * Variasi animasi dialog modal dengan fisika pegas Apple interruptible.
 * Buka: Pegas responsif critically-damped (halus & dapat di-interupsi seketika)
 * Tutup: Transisi akselerasi keluar cepat agar tidak menahan pengguna
 */
export const modalDialogVariants = {
  hidden: (origin) => ({
    opacity: 0,
    scale: 0.95,
    y: 8,
    transformOrigin: origin || "center center",
    transition: {
      duration: 0.16,
      ease: EASE_POWER_IN,
    },
  }),
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transformOrigin: "center center",
    transition: APPLE_SPRINGS.default,
  },
};

/**
 * Variasi stagger kontainer untuk Bento Grid dan daftar kartu modular.
 * Mencegah semua elemen meloncat sekaligus, memberikan efek air terjun bertahap (~40ms).
 */
export const bentoContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

/**
 * Variasi item bento individual dengan initial scale 0.96 (Emil Kowalski: never scale from 0).
 */
export const bentoItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: APPLE_SPRINGS.default,
  },
};

/**
 * Spring transisi untuk indikator tab aktif (Shared Layout).
 */
export const tabIndicatorSpring = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};
