import { av } from "@/lib/design";

export function Avatar({
  name,
  color,
  ini,
  avatarUrl,
  size,
  extraStyle,
}: {
  name: string;
  color: string;
  ini: string;
  avatarUrl?: string | null;
  size: number;
  extraStyle?: React.CSSProperties;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        style={{
          width: size,
          height: size,
          flex: "none",
          borderRadius: 99,
          objectFit: "cover",
          ...extraStyle,
        }}
      />
    );
  }
  return (
    <div title={name} style={{ ...av(color, size), ...extraStyle }}>
      {ini}
    </div>
  );
}
