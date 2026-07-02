"use client";

import { PartnerAppConfig } from "@/types/request";
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
            {message}
          </p>
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
