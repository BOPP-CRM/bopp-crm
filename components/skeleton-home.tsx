"use client";
import { useApp } from "./providers/app-provider";

export default function SkeletonHome() {
  const { clientConfig } = useApp();
  const { text_gray_color, surface_color, background_color } = clientConfig.ui;

  const shimmer = `color-mix(in srgb, ${text_gray_color} 18%, transparent)`;
  const shimmerDeep = `color-mix(in srgb, ${text_gray_color} 28%, transparent)`;
  const page = `color-mix(in srgb, ${text_gray_color} 22%, transparent)`;

  const sk = (extraStyle?: React.CSSProperties): React.CSSProperties => ({
    backgroundColor: shimmer,
    ...extraStyle,
  });

  return (
    <div
      className="h-dvh pb-20 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, ${background_color} 100%)`,
      }}
    >
      {/* banner */}
      <div className="relative h-80 -mb-45">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: surface_color }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, ${background_color} 100%)`,
          }}
        />
      </div>

      {/* header */}
      <div className="relative z-2 pt-16 px-4.5 pb-4.5 flex items-center justify-between">
        <div className="animate-pulse h-9.5 w-20 rounded-xl" style={sk()} />
        <div className="animate-pulse h-9.5 w-9.5 rounded-xl" style={sk()} />
      </div>

      {/* profile row */}
      <div className="relative z-2 flex items-center gap-4 px-4.5 pb-5.5 animate-pulse">
        <div className="h-12.5 w-12.5 rounded-full shrink-0" style={sk()} />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 w-28 rounded-lg" style={sk()} />
          <div className="h-3 w-40 rounded-lg" style={sk()} />
        </div>
      </div>

      {/* point card */}
      <section
        className="mx-4.5 mb-5.5 rounded-[22px] pt-5.5 px-5.5 pb-5 animate-pulse"
        style={sk()}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="h-3.5 w-20 rounded-full" style={sk()} />
          <div
            className="h-5 w-16 rounded-full"
            style={{ backgroundColor: shimmer }}
          />
        </div>
        <div
          className="h-14 w-32 rounded-xl mt-2"
          style={{ backgroundColor: shimmer }}
        />
        <div
          className="h-3 w-12 rounded-full mt-1"
          style={{ backgroundColor: shimmer }}
        />
      </section>

      {/* tier card */}
      <section
        className="mx-4.5 mb-5.5 rounded-[18px] pt-4 px-4.5 pb-3.5 animate-pulse"
        style={sk()}
      >
        <div className="flex justify-between items-center mb-3">
          <div
            className="h-3.5 w-28 rounded-full"
            style={{ backgroundColor: shimmerDeep }}
          />
          <div
            className="h-3.5 w-16 rounded-full"
            style={{ backgroundColor: shimmerDeep }}
          />
        </div>
        <div
          className="h-2 w-full rounded-full"
          style={{ backgroundColor: shimmerDeep }}
        />
        <div
          className="h-3.5 w-48 rounded-full mt-3"
          style={{ backgroundColor: shimmerDeep }}
        />
      </section>

      {/* news section */}
      <section className="mb-5.5">
        <div
          className="mx-4.5 mb-3.5 h-5 w-24 rounded-lg animate-pulse"
          style={sk()}
        />
        <div className="flex gap-3 px-4.5 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-40 h-28 rounded-[14px] animate-pulse"
              style={sk()}
            />
          ))}
        </div>
      </section>

      {/* coupon section */}
      <section className="mx-4.5 mb-5.5">
        <div className="h-5 w-32 rounded-lg animate-pulse mb-4" style={sk()} />
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-[18px] animate-pulse"
              style={sk()}
            />
          ))}
        </div>
      </section>

      {/* navbar */}
      <div
        className="navbar grid grid-cols-5 justify-around items-center pt-2 px-3.5 pb-7.5"
        style={{ background: background_color }}
      >
        {[1, 2, 3, 4, 5].map((i) =>
          i === 3 ? (
            <div key={i} className="flex justify-center">
              <div
                className="w-15 h-15 rounded-full animate-pulse -translate-y-1"
                style={sk()}
              />
            </div>
          ) : (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 animate-pulse"
            >
              <div className="h-6 w-6 rounded-lg" style={sk()} />
              <div className="h-2.5 w-10 rounded-full" style={sk()} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
