import { useEffect, useState } from "react";
import { countdownParts } from "../lib/format";

/**
 * Countdown besar menuju hari pernikahan.
 * `variant="hero"` untuk dashboard, `variant="compact"` untuk card kecil.
 */
export default function Countdown({ target, variant = "hero" }) {
  const [parts, setParts] = useState(() => countdownParts(target));

  useEffect(() => {
    // Sinkronkan segera saat `target` berubah, lalu perbarui tiap detik.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- timer eksternal, bukan render turunan
    setParts(countdownParts(target));
    const id = setInterval(() => setParts(countdownParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { label: "Hari", value: parts.days },
    { label: "Jam", value: parts.hours },
    { label: "Menit", value: parts.minutes },
    { label: "Detik", value: parts.seconds },
  ];

  if (variant === "compact") {
    return (
      <p className="text-sm text-gray-500">
        <span className="font-bold text-primary text-lg">{parts.days}</span> hari lagi menuju hari H
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {units.map((u) => (
        <div
          key={u.label}
          className="bg-white/15 backdrop-blur rounded-2xl py-3 px-1 text-center border border-white/20"
        >
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-white">
            {String(u.value).padStart(2, "0")}
          </p>
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/70 mt-0.5">{u.label}</p>
        </div>
      ))}
    </div>
  );
}
