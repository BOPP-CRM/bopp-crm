import { useApp } from "./providers/app-provider";

const Sk = ({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div className={`animate-pulse rounded-xl ${className}`} style={style} />
);

export default function SkeletonMember() {
  const { clientConfig } = useApp();
  const { text_gray_color, surface_color } = clientConfig.ui;

  const shimmer = `color-mix(in srgb, ${text_gray_color} 18%, transparent)`;
  const shimmerDeep = `color-mix(in srgb, ${text_gray_color} 28%, transparent)`;
  const border = `color-mix(in srgb, ${text_gray_color} 80%, transparent)`;

  const rowStyle = { borderColor: border };

  return (
    <div className="p-5">
      {/* title */}
      <Sk className="h-8 w-44 mt-5 mb-6" style={{ backgroundColor: shimmer }} />

      {/* avatar + name */}
      <div className="flex flex-col items-center mb-5 gap-3 animate-pulse">
        <div
          className="h-21 w-21 rounded-full"
          style={{ backgroundColor: shimmer }}
        />
        <Sk className="h-6 w-36" style={{ backgroundColor: shimmer }} />
        <div className="flex items-center gap-2">
          <Sk className="h-5 w-16 rounded-full" style={{ backgroundColor: shimmer }} />
          <Sk className="h-3.5 w-28 rounded-full" style={{ backgroundColor: shimmer }} />
        </div>
      </div>

      {/* info card */}
      <div
        className="rounded-[18px] border-[0.5px]"
        style={{ background: surface_color, borderColor: border }}
      >
        <Sk
          className="mt-3 mx-4 mb-2 h-3 w-16 rounded-full"
          style={{ backgroundColor: shimmerDeep }}
        />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`flex justify-between items-center py-3 px-4 ${i < 6 ? "border-b-[0.5px]" : ""}`}
            style={rowStyle}
          >
            <Sk className="h-4 w-20" style={{ backgroundColor: shimmerDeep }} />
            <Sk className="h-3.5 w-24 rounded-full" style={{ backgroundColor: shimmerDeep }} />
          </div>
        ))}
      </div>

      {/* logout button */}
      <Sk
        className="h-12 w-full rounded-[18px] mt-6"
        style={{ backgroundColor: shimmer }}
      />
    </div>
  );
}
