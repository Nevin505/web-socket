export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Avatar = ({ name, size = "md", className = "" }: AvatarProps) => {
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
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 font-bold text-blue-700 shadow-sm ${sizes[size]} ${className}`}
    >
      {initials || "U"}
    </div>
  );
};

export default Avatar;
