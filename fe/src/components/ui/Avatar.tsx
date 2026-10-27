export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "online" | "offline" | "busy";
}

export const Avatar = ({ name, size = "md", className = "", status }: AvatarProps) => {
  const initials = (name || "U")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-14 w-14 text-lg",
  };

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary font-bold text-white shadow-md shadow-primary/20 ${sizes[size]} ${className}`}
      >
        {initials || "U"}
      </div>
      {status === "online" && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-dark-card" />
      )}
    </div>
  );
};

export default Avatar;
