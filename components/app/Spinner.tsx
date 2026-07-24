/** Spinner compartilhado — usa o keyframe global `spin` definido em app/globals.css. */
export function Spinner({ size = 14, color = "#4653d6" }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        display: "inline-block",
        border: "2px solid #e2e2de",
        borderTopColor: color,
        borderRadius: 99,
        animation: "spin .7s linear infinite",
      }}
    />
  );
}
