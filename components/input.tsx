/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, {
  HTMLInputTypeAttribute,
  ReactNode,
  useRef,
  useState,
  useEffect,
} from "react";
import { PhotoUp } from "tabler-icons-react";
import { useApp } from "./providers/app-provider";

type InputElement = HTMLInputElement | HTMLTextAreaElement;

interface InputProp {
  storageKey?: string;
  dataTestid?: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  icon?: ReactNode;
  className?: string;
  inputMode?:
    | "email"
    | "search"
    | "tel"
    | "text"
    | "url"
    | "none"
    | "numeric"
    | "decimal"
    | undefined;
  accept?: string;
  multiple?: boolean;
  value: any;
  label?: string;
  required?: boolean;
  suffix?: ReactNode;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  onChange: (value: any) => void;
  onKeyDown?: (e: React.KeyboardEvent<InputElement>) => void;
  onFocus?: (e: React.FocusEvent<InputElement>) => void;
  onBlur?: (e: React.FocusEvent<InputElement>) => void;
}

const isFileType = (t: string | undefined) => t === "file" || t === "image";

function getStored(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function setStored(storageKey: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(storageKey);
    } else if (typeof value === "object" && value instanceof FileList) {
    } else {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
}

export default function Input({
  storageKey,
  dataTestid,
  placeholder,
  type = "text",
  icon,
  className,
  inputMode,
  accept,
  multiple = false,
  value,
  label,
  required = false,
  suffix,
  disabled = false,
  multiline = false,
  rows = 3,
  maxLength,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
}: InputProp) {
  const inputRef = useRef<InputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasRestoredRef = useRef(false);
  const isFile = isFileType(type);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { clientConfig } = useApp();

  useEffect(() => {
    if (!storageKey || isFile || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const raw = getStored(storageKey);
    if (raw === null) return;
    try {
      const parsed = JSON.parse(raw) as string | number;
      onChange(parsed);
    } catch {
      onChange(raw);
    }
  }, [storageKey, isFile, onChange]);

  const persistChange = (newValue: unknown) => {
    onChange(newValue);
    if (storageKey && !isFile) setStored(storageKey, newValue);
  };

  const hasImageFiles =
    isFile && type === "image" && value instanceof FileList && value.length > 0;

  useEffect(() => {
    if (!hasImageFiles || !(value instanceof FileList)) {
      setPreviewUrls((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      return;
    }
    const files = Array.from(value);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return urls;
    });
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [type, value, hasImageFiles]);

  const handleClick = () => {
    if (disabled) return;
    if (isFile && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }
    if (inputRef.current) {
      inputRef.current.focus();
      if (
        !multiline &&
        type === "number" &&
        value === 0 &&
        "select" in inputRef.current
      ) {
        inputRef.current.select();
      }
    }
  };

  const inputClassName = `w-full py-2 text-lg outline-none resize-none ${disabled ? "cursor-not-allowed" : ""}`;
  const showCharCount = maxLength != null && !isFile;
  const currentLength = showCharCount
    ? value == null || value === ""
      ? 0
      : String(value).length
    : 0;
  const atLimit = showCharCount && currentLength >= maxLength;
  const showCounterInside = showCharCount && multiline;
  const wrapperClassName = `h-14 rounded-[14px] shadow-md flex gap-3 px-3 ${showCounterInside ? "relative pb-6" : ""} ${multiline ? "items-start" : "justify-center items-center"} ${disabled ? "cursor-not-allowed bg-gray-50" : isFile ? "cursor-pointer" : "cursor-text"} ${className ?? ""}`;

  const fileAccept = type === "image" ? "image/*" : accept;
  const isImageUpload = isFile && type === "image";
  const showImagePreviews = isImageUpload && previewUrls.length > 0;
  const displayFileNames =
    isFile && !showImagePreviews && value != null
      ? value instanceof FileList
        ? Array.from(value)
            .map((f) => f.name)
            .join(", ")
        : typeof value === "string"
          ? value
          : null
      : null;

  return (
    <div
      className="w-full flex flex-col gap-2"
      style={{ color: clientConfig.ui.button_color }}
    >
      {label && (
        <label className="block" style={{ color: clientConfig.ui.text_color }}>
          {label}{" "}
          {required && (
            <span style={{ color: clientConfig.ui.text_error_color }}>*</span>
          )}
        </label>
      )}
      <div
        className={wrapperClassName}
        onClick={handleClick}
        style={{
          background: clientConfig.ui.surface_color,
          border: `0.5px solid rgba(255,255,255,0.08)`,
          color: clientConfig.ui.text_gray_color,
        }}
      >
        {icon}
        {multiline ? (
          <textarea
            data-testid={dataTestid}
            value={value ?? ""}
            onChange={(e) => persistChange(e.target.value)}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            onKeyDown={
              onKeyDown as React.KeyboardEventHandler<HTMLTextAreaElement>
            }
            onFocus={onFocus as React.FocusEventHandler<HTMLTextAreaElement>}
            onBlur={onBlur as React.FocusEventHandler<HTMLTextAreaElement>}
            disabled={disabled}
            maxLength={maxLength}
            className={inputClassName}
            placeholder={placeholder ?? ""}
            rows={rows}
          />
        ) : isFile ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={fileAccept}
              multiple={multiple}
              onChange={(e) => persistChange(e.target.files)}
              disabled={disabled}
              className="hidden"
              data-testid={dataTestid}
            />
            <div className="w-full min-h-[100px] flex flex-col items-center justify-center gap-2 py-3 pointer-events-none">
              {showImagePreviews ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {previewUrls.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="object-cover w-20 h-20 rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              ) : (
                <>
                  <PhotoUp size={36} className="text-primary" />
                  <span className="text-sm text-gray-600 text-center">
                    {type === "image"
                      ? "คลิกเพื่ออัปโหลดรูป"
                      : "คลิกเพื่อเลือกไฟล์"}
                  </span>
                  {displayFileNames ? (
                    <span className="text-xs text-gray-500 truncate max-w-full px-2">
                      {displayFileNames}
                    </span>
                  ) : placeholder ? (
                    <span className="text-xs text-gray-400">{placeholder}</span>
                  ) : null}
                </>
              )}
            </div>
          </>
        ) : (
          <input
            data-testid={dataTestid}
            value={value}
            onChange={(e) => persistChange(e.target.value)}
            type={type}
            inputMode={inputMode}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            onKeyDown={
              onKeyDown as React.KeyboardEventHandler<HTMLInputElement>
            }
            onFocus={onFocus as React.FocusEventHandler<HTMLInputElement>}
            onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
            disabled={disabled}
            maxLength={maxLength}
            className={inputClassName}
            placeholder={placeholder ?? ""}
            style={{
              color: disabled
                ? clientConfig.ui.text_gray_color
                : clientConfig.ui.text_white_color,
            }}
          />
        )}
        {suffix}
        {showCounterInside && (
          <div
            className={`absolute bottom-2 right-3 text-xs ${atLimit ? "text-primary font-medium" : "text-gray-500"}`}
          >
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
      {showCharCount && !multiline && (
        <div
          className={`text-right text-xs -mt-1 ${atLimit ? "text-primary font-medium" : "text-gray-500"}`}
        >
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  );
}
