interface ICTLogoProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeClass = {
  sm: "h-7 w-7 text-sm",
  md: "h-16 w-16 text-2xl",
  lg: "h-24 w-24 text-4xl",
};

export default function ICTLogo({ size = "md", showName = false, className = "" }: ICTLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeClass[size]} flex shrink-0 items-center justify-center rounded-[22%] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_82%,transparent)] font-black tracking-[-0.14em] shadow-[0_18px_70px_color-mix(in_srgb,var(--color-shadow)_22%,transparent)] backdrop-blur-xl`}
        aria-label="ICT"
      >
        <span className="text-[#c7342f]">I</span>
        <span className="text-[#c7342f]">C</span>
        <span className="text-[var(--color-text)]">T</span>
      </div>
      {showName && (
        <span className="text-sm font-semibold text-[var(--color-text)]">
          ICT数字化教学平台
        </span>
      )}
    </div>
  );
}

