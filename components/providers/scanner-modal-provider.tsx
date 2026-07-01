"use client";

import { Html5Qrcode } from "html5-qrcode/esm/html5-qrcode";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type OpenScannerOptions = {
  onResult?: (decodedText: string) => void | Promise<void>;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textWhiteColor?: string;
};

type ScannerModalContextType = {
  openScanner: (options?: OpenScannerOptions) => void;
  closeScanner: () => void;
};

const ScannerModalContext = createContext<ScannerModalContextType | null>(null);

function ScannerModal({
  options,
  onClose,
}: {
  options: OpenScannerOptions;
  onClose: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode("qr-reader-utility");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const size = Math.floor(
                Math.min(viewfinderWidth, viewfinderHeight) * 0.7,
              );
              return { width: size, height: size };
            },
          },
          (decodedText: string) => {
            try {
              options.onResult?.(decodedText);
            } catch (error) {
              console.error(error);
            }
          },
          () => {
            // ignore per-frame scan errors
          },
        );
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          onClose();
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      const currentScanner = scannerRef.current;
      scannerRef.current = null;

      if (!currentScanner) return;

      try {
        if ((currentScanner as { isScanning?: boolean }).isScanning) {
          void currentScanner.stop().catch(console.error);
        }
        currentScanner.clear();
      } catch (error) {
        console.error(error);
      }
    };
  }, [onClose, options]);

  return (
    <div className="qr-scanner-overlay fixed inset-0 z-100 h-dvh w-full overflow-hidden bg-black">
      <button
        className="absolute right-4 top-4 z-20 h-8 w-8 cursor-pointer rounded-full p-2"
        style={{
          background: options.primaryColor || "#4C1D95",
          color: options.textWhiteColor || "#fff",
        }}
        onClick={onClose}
      >
        ✕
      </button>

      <div
        id="qr-reader-utility"
        className="absolute inset-0 h-full w-full min-h-0"
      />

      <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center px-4">
        <div
          className="rounded-md px-5 py-2 text-center text-2xl"
          style={{
            background: options.secondaryColor || "#6b21a8",
            color: options.textWhiteColor || "#fff",
          }}
        >
          {options.title || "สแกน QR Code"}
          <br />
          {options.subtitle || "กรุณาวาง QR Code ให้อยู่ในกรอบ"}
        </div>
      </div>
    </div>
  );
}

export function ScannerModalProvider({ children }: { children: ReactNode }) {
  const [scannerOptions, setScannerOptions] =
    useState<OpenScannerOptions | null>(null);
  const previousOverflowRef = useRef<string | null>(null);

  const closeScanner = useCallback(() => {
    setScannerOptions(null);
  }, []);

  const openScanner = useCallback((options: OpenScannerOptions = {}) => {
    setScannerOptions(options);
  }, []);

  const handleModalClose = useCallback(() => {
    scannerOptions?.onClose?.();
    closeScanner();
  }, [scannerOptions, closeScanner]);

  useEffect(() => {
    if (scannerOptions && previousOverflowRef.current === null) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    if (!scannerOptions && previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
    }
  }, [scannerOptions]);

  useEffect(() => {
    return () => {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
    };
  }, []);

  return (
    <ScannerModalContext.Provider value={{ openScanner, closeScanner }}>
      {scannerOptions && (
        <ScannerModal options={scannerOptions} onClose={handleModalClose} />
      )}
      {children}
    </ScannerModalContext.Provider>
  );
}

export function useScannerModalContext() {
  const context = useContext(ScannerModalContext);
  if (!context) {
    throw new Error(
      "useScannerModalContext must be used within ScannerModalProvider",
    );
  }
  return context;
}
