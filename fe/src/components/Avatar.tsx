interface AvatarProps {
  name: string;
  size?: "sm" | "md";
}

const Avatar = ({ name, size = "md" }: AvatarProps) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm" };

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 ${sizes[size]}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;