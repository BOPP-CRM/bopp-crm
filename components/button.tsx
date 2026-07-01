import React, { JSX } from "react";
import { useApp } from "./providers/app-provider";

interface InputProp {
  text: string;
  onClick?: () => void;
  className?: string;
  icon?: JSX.Element;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Button({
  text,
  className,
  onClick,
  icon,
  disabled = false,
  size = "md",
}: InputProp) {
  const { clientConfig } = useApp();

  const sizeClassName =
    size === "sm"
      ? "h-10 px-3 text-sm rounded-lg"
      : size === "lg"
        ? "h-14 px-5 text-base rounded-xl"
        : "h-[52px] px-4 text-[15px] rounded-xl";

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${className ?? ""} ${sizeClassName} w-full text-center font-semibold flex gap-3 justify-center items-center ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
      style={{
        backgroundColor: clientConfig.ui.button_color,
        color: clientConfig.ui.button_text_color,
      }}
      onClick={handleClick}
    >
      {icon} {text}
    </button>
  );
}
