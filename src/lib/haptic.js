/**
 * Haptic Feedback Utility (REC-04)
 * Memberikan getaran fisik subtil pada perangkat mobile layar sentuh
 * untuk mengonfirmasi aksi pengguna (sukses scan QR, toggle switch, check-in tamu).
 */

export function triggerHaptic(type = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    switch (type) {
      case "selection":
      case "light":
        navigator.vibrate?.(10);
        break;
      case "medium":
        navigator.vibrate?.(20);
        break;
      case "success":
        navigator.vibrate?.([12, 40, 18]);
        break;
      case "warning":
        navigator.vibrate?.([25, 40, 25]);
        break;
      case "error":
        navigator.vibrate?.([40, 60, 40]);
        break;
      default:
        navigator.vibrate?.(10);
    }
  } catch {
    // Ignore unsupported browser permission issues silently
  }
}
