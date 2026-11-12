"use client";

import { PartnerAppConfig } from "@/types/request";
import { splitTraceReference } from "@/util/trace-id";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFullLoadingContext } from "./full-loading-provider";

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // LINE and other webviews often reject the async clipboard API.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function TraceReference({
  traceId,
  accentColor,
  mutedColor,
}: {
  traceId: string;
  accentColor?: string;
  mutedColor?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  return (
    <div
      className="mt-3 rounded-2xl px-3 py-2 text-left"
      style={{
        background: mutedColor
          ? `color-mix(in srgb, ${mutedColor} 14%, transparent)`
          : "rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] leading-4" style={{ color: mutedColor }}>
          รหัสอ้างอิง
        </p>
        <button
          type="button"
          className="shrink-0 rounded-xl px-2.5 py-1 text-xs font-medium active:scale-[0.99]"
          style={{
            color: accentColor,
            background: accentColor
              ? `color-mix(in srgb, ${accentColor} 12%, transparent)`
              : "rgba(0,0,0,0.06)",
          }}
          aria-label="คัดลอกรหัสอ้างอิง"
          onClick={(event) => {
            event.stopPropagation();
            void copyText(traceId).then((didCopy) => {
              if (didCopy) setCopied(true);
            });
          }}
        >
          {copied ? "คัดลอกแล้ว" : "คัดลอก"}
        </button>
      </div>
      <p className="mt-0.5 break-all font-mono text-[11px] leading-5 select-all">
        {traceId}
      </p>
    </div>
  );
}

export type OpenAlertOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  hasCancel?: boolean;
  icon?: ReactNode;
  onConfirm?: () => void;
};

type AlertModalContextType = {
  openAlert: (options: OpenAlertOptions) => Promise<void>;
  closeAlert: () => void;
  setFullLoading: (value: boolean) => void;
  setAlertClientConfig: (config: PartnerAppConfig) => void;
};

const AlertModalContext = createContext<AlertModalContextType | null>(null);

function AlertModal({
  options,
  clientConfig: providerClientConfig,
  onClose,
}: {
  options: OpenAlertOptions;
  clientConfig: PartnerAppConfig | null;
  onClose: () => void;
}) {
  const {
    title = "แจ้งเตือน",
    message,
    confirmText = "ตกลง",
    hasCancel = false,
    onConfirm = () => {},
  } = options;

  const clientConfig = providerClientConfig;
  const parsedMessage = splitTraceReference(message);
  const displayMessage = parsedMessage.traceId
    ? parsedMessage.message || "เกิดข้อผิดพลาด"
    : message;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 pt-10"
      style={{ zIndex: 200 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[28px] shadow-2xl pb-5"
        style={{
          background: clientConfig?.ui.surface_color,
          color: clientConfig?.ui.text_color,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pb-4 pt-5 text-center">
          {options.icon && (
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: `${clientConfig?.ui.primary_color}1A`,
                color: clientConfig?.ui.primary_color,
              }}
            >
              {options.icon}
            </div>
          )}

          <h3 className="text-lg font-semibold leading-6">{title}</h3>
          <p
            className="mt-2 text-sm leading-6"
            style={{
              color: clientConfig?.ui.text_gray_color,
            }}
          >
            {displayMessage}
          </p>
          {parsedMessage.traceId ? (
            <TraceReference
              key={parsedMessage.traceId}
              traceId={parsedMessage.traceId}
              accentColor={clientConfig?.ui.primary_color}
              mutedColor={clientConfig?.ui.text_gray_color}
            />
          ) : null}
        </div>

        <div className="px-5 pt-1 flex gap-2 items-center justify-center">
          {hasCancel && (
            <button
              type="button"
              className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white active:scale-[0.99]"
              style={{
                background: `color-mix(in srgb, ${clientConfig?.ui.text_gray_color} 20%, ${clientConfig?.ui.surface_color})`,
              }}
              onClick={onClose}
            >
              ยกเลิก
            </button>
          )}
          <button
            type="button"
            className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white active:scale-[0.99]"
            style={{ background: clientConfig?.ui.primary_color }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertModalProvider({ children }: { children: ReactNode }) {
  const setFullLoading = useFullLoadingContext();
  const [alertOptions, setAlertOptions] = useState<OpenAlertOptions | null>(
    null,
  );
  const [providerClientConfig, setProviderClientConfig] =
    useState<PartnerAppConfig | null>(null);
  const resolverRef = useRef<(() => void) | null>(null);
  const previousOverflowRef = useRef<string | null>(null);

  const setAlertClientConfig = useCallback((config: PartnerAppConfig) => {
    setProviderClientConfig(config);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertOptions(null);
    resolverRef.current?.();
    resolverRef.current = null;
  }, []);

  const openAlert = useCallback((options: OpenAlertOptions) => {
    if (resolverRef.current) {
      resolverRef.current();
      resolverRef.current = null;
    }

    setAlertOptions(options);

    return new Promise<void>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (alertOptions && previousOverflowRef.current === null) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    if (!alertOptions && previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
    }
  }, [alertOptions]);

  useEffect(() => {
    return () => {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
      resolverRef.current?.();
      resolverRef.current = null;
    };
  }, []);

  return (
    <AlertModalContext.Provider
      value={{
        openAlert,
        closeAlert,
        setFullLoading,
        setAlertClientConfig,
      }}
    >
      {alertOptions && (
        <AlertModal
          options={alertOptions}
          clientConfig={providerClientConfig}
          onClose={closeAlert}
        />
      )}
      {children}
    </AlertModalContext.Provider>
  );
}

export function useAlertModalContext() {
  const context = useContext(AlertModalContext);
  if (!context) {
    throw new Error(
      "useAlertModalContext must be used within AlertModalProvider",
    );
  }
  return context;
}
