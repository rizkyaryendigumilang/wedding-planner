import { initials } from "../lib/format";

const SIZES = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

/**
 * Avatar inisial. Bila `src` diisi, foto ditampilkan; bila gagal dimuat atau
 * kosong, inisial tetap muncul — tidak pernah ada kotak kosong di antarmuka.
 */
export function Avatar({ name, src, size = "md", className = "" }) {
  const dimension = SIZES[size] || SIZES.md;
  const label = initials(name || "?");

  return (
    <span
      className={`relative shrink-0 rounded-full overflow-hidden grid place-items-center bg-rose-500/12 text-rose-700 dark:text-rose-300 font-semibold ring-1 ring-inset ring-rose-500/15 ${dimension} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        label
      )}
    </span>
  );
}
