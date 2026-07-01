"use client";
import React, { ReactNode } from "react";
import { useApp } from "./providers/app-provider";

interface ChipButtonProps {
  label?: ReactNode;
  selected?: boolean; // controlled
  onSelect?: (selected: boolean) => void;
  disabled?: boolean;
}

export default function ChipButton({
  label,
  selected,
  onSelect,
  disabled = false,
}: ChipButtonProps) {
  const { clientConfig } = useApp();

  return (
    <div
      onClick={onSelect ? () => onSelect(!selected) : undefined}
      className="px-3.5 h-8 rounded-full cursor-pointer flex items-center justify-center text-xs font-semibold whitespace-nowrap"
      style={{
        backgroundColor: selected
          ? clientConfig.ui.secondary_color
          : clientConfig.ui.surface_color,
        color: selected
          ? clientConfig.ui.text_white_color
          : clientConfig.ui.text_color,
        border: selected ? "" : `0.5px solid rgba(255,255,255,0.08)`,
      }}
    >
      {label}
    </div>
  );
}
