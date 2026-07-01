import { CSSProperties, JSX } from "react";

interface CardProp {
  title: JSX.Element;
  value: JSX.Element;
  className?: string;
  style?: CSSProperties;
}

export default function Card({ title, value, className, style }: CardProp) {
  return (
    <div
      className={`text-amber-50 w-full p-3 rounded-md ${className}`}
      style={style}
    >
      <div className="text-2xl flex gap-2 items-center font-medium">
        {title}
      </div>
      <div className="text-xl">{value}</div>
    </div>
  );
}
