"use client";
import { useApp } from "@/components/providers/app-provider";
import { IconChevronDown, IconUser } from "@tabler/icons-react";
import { useState } from "react";

export interface ThemedSelectProps {
  placeholder: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string, name: string) => void;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
}

export default function ThemedSelect({
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  label,
  icon,
}: ThemedSelectProps) {
  const { clientConfig } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((o) => o.id === value);

  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <label className="block" style={{ color: clientConfig.ui.text_color }}>
          {label}
        </label>
      )}
      <div
        className={`h-14 rounded-[14px] shadow-md flex gap-3 px-3 items-center ${
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
        }`}
        style={{
          background: clientConfig.ui.surface_color,
          border: `0.5px solid rgba(255,255,255,0.08)`,
          color: clientConfig.ui.text_white_color,
        }}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="flex-1 text-lg truncate">
          {selected ? (
            selected.name
          ) : (
            <span className="opacity-50">{placeholder}</span>
          )}
        </div>
        <IconChevronDown
          size={20}
          className="shrink-0"
          color="rgb(106, 114, 130)"
        />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl min-h-[40vh] max-h-[70vh] overflow-hidden w-screen md:w-[500px] mx-auto"
            style={{ background: clientConfig.ui.surface_color }}
          >
            <div className="overflow-y-auto max-h-[calc(70vh-8px)]">
              {options.map((opt) => (
                <div
                  key={opt.id}
                  className="px-5 py-4 cursor-pointer text-[15px] hover:bg-gray-100 transition-colors border-b"
                  style={{
                    color: clientConfig.ui.text_white_color,
                    borderColor: clientConfig.ui.text_gray_color + "20",
                    backgroundColor:
                      value === opt.id
                        ? clientConfig.ui.primary_color + "20"
                        : "transparent",
                  }}
                  onClick={() => {
                    onChange(opt.id, opt.name);
                    setIsOpen(false);
                  }}
                >
                  {opt.name}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
