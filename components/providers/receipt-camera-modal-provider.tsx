"use client";

/* eslint-disable @next/next/no-img-element */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAlertModalContext } from "./alert-modal-provider";
import {
  IconAlertTriangle,
  IconCamera,
  IconRosetteDiscountCheck,
  IconX,
} from "@tabler/icons-react";
import type { PartnerAppConfig } from "@/types/request";

export type ReceiptSubmitPayload = {
  receiptNumber: string;
  receiptImage: string;
};

export type ReceiptSubmitResult =
  | void
  | boolean
  | {
      ok?: boolean;
      message?: string;
    };

export type OpenReceiptOptions = {
  onSubmit?: (
    payload: ReceiptSubmitPayload,
  ) => Promise<ReceiptSubmitResult> | ReceiptSubmitResult;
  clientConfig?: PartnerAppConfig;
  onClose?: () => void;
  primaryColor?: string;
  textWhiteColor?: string;
  textGrayColor?: string;
  backgroundWhiteColor?: string;
};

type ReceiptCameraModalContextType = {
  openReceipt: (options?: OpenReceiptOptions) => void;
  closeReceipt: () => void;
};

const ReceiptCameraModalContext =
  createContext<ReceiptCameraModalContextType | null>(null);

function ReceiptCameraModal({
  options,
  onClose,
}: {
  options: OpenReceiptOptions;
  onClose: () => void;
}) {
  const { openAlert, setFullLoading } = useAlertModalContext();

  const primaryColor =
    options.primaryColor ||
    options.clientConfig?.ui?.primary_color ||
    "#4C1D95";
  const textWhiteColor =
    options.textWhiteColor ||
    options.clientConfig?.ui?.text_white_color ||
    "#FFFFFF";
  const textGrayColor =
    options.textGrayColor ||
    options.clientConfig?.ui?.text_gray_color ||
    "#9CA3AF";

  const secondaryColor = options.clientConfig?.ui?.secondary_color || "#9333EA";
  const clientConfig = options.clientConfig;

  const [receiptNumber, setReceiptNumber] = useState("");
  const [receiptImage, setReceiptImage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestIdRef = useRef(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = ++cameraRequestIdRef.current;

    try {
      setCameraError("");
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (requestId !== cameraRequestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          throw error;
        }
      }
    } catch (error) {
      console.error(error);
      setCameraError("ไม่สามารถเปิดกล้องได้");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!receiptImage) {
      Promise.resolve().then(startCamera);
    }

    return () => {
      stopCamera();
    };
  }, [receiptImage, startCamera, stopCamera]);

  const handleCapture = async () => {
    try {
      const video = videoRef.current;
      if (!video?.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setReceiptImage(dataUrl.replace(/^data:image\/\w+;base64,/, ""));
      stopCamera();
    } catch {
      await openAlert({
        title: "ถ่ายรูปไม่สำเร็จ",
        message: "ไม่สามารถถ่ายรูปได้",
        icon: <IconAlertTriangle size={24} />,
      });
    }
  };

  const handleRetake = () => {
    setReceiptImage("");
  };

  const handleSubmit = async () => {
    if (!receiptNumber.trim()) {
      await openAlert({
        title: "ข้อมูลไม่ครบ",
        message: "กรุณากรอกเลขใบเสร็จ",
        icon: <IconAlertTriangle size={24} />,
      });
      return;
    }

    if (!receiptImage) {
      await openAlert({
        title: "ข้อมูลไม่ครบ",
        message: "กรุณาถ่ายรูปใบเสร็จ",
        icon: <IconAlertTriangle size={24} />,
      });
      return;
    }

    try {
      setFullLoading(true);

      const result = await options.onSubmit?.({
        receiptNumber: receiptNumber.trim(),
        receiptImage,
      });

      if (result === false) return;

      if (typeof result === "object" && result?.ok === false) {
        if (result.message) {
          await openAlert({
            title: "ส่งใบเสร็จไม่สำเร็จ",
            message: result.message,
            icon: <IconAlertTriangle size={24} />,
          });
        }
        return;
      }

      await openAlert({
        title: "ส่งใบเสร็จสำเร็จ",
        message: "กรุณารอการตรวจสอบจากร้านค้า",
        icon: <IconRosetteDiscountCheck size={24} />,
      });
      onClose();
    } catch (error) {
      console.error(error);
      await openAlert({
        title: "เกิดข้อผิดพลาด",
        message: "เกิดข้อผิดพลาดขณะส่งใบเสร็จ",
        icon: <IconAlertTriangle size={24} />,
      });
    } finally {
      setFullLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black">
      {!receiptImage ? (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {!!cameraError && (
            <div className="absolute left-4 right-4 top-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-400">
              {cameraError}
            </div>
          )}

          <button
            type="button"
            onClick={handleCapture}
            className="absolute bottom-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 font-semibold"
            style={{
              background: primaryColor,
              color: textWhiteColor,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            <IconCamera size={24} />
          </button>

          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white"
            onClick={onClose}
          >
            <IconX size={18} />
          </button>
        </div>
      ) : (
        <div className="relative flex h-full w-full flex-col">
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white"
            onClick={onClose}
          >
            <IconX size={18} />
          </button>

          <img
            src={`data:image/jpeg;base64,${receiptImage}`}
            alt="receipt-preview"
            className="w-full h-full bg-black object-cover"
          />

          <div
            className="pt-8 pb-6 px-4 rounded-t-[22px] absolute bottom-0 left-0 right-0"
            style={{ background: clientConfig?.ui?.surface_color }}
          >
            <div
              className="flex justify-between mb-3"
              style={{
                color: clientConfig?.ui.text_color,
              }}
            >
              <p className="block text-lg font-semibold">เลขใบเสร็จ</p>
              <div className="flex items-center gap-1" onClick={handleRetake}>
                <IconCamera size={20} />
                <p>ถ่ายใหม่</p>
              </div>
            </div>

            <input
              value={receiptNumber}
              onChange={(event) => setReceiptNumber(event.target.value)}
              placeholder="กรอกเลขใบเสร็จ"
              className="w-full rounded-xl px-4 py-5"
              style={{
                border: `1px solid ${textGrayColor}`,
                color: clientConfig?.ui?.text_color,
              }}
            />

            <button
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 8px 24px -6px color-mix(in oklch,${primaryColor} 60%, transparent)`,
                color: clientConfig?.ui?.button_text_color,
              }}
              className="mt-5 h-14 w-full text-center p-2 text-[15px] rounded-[14px] cursor-pointer flex gap-3 justify-center items-center"
              onClick={handleSubmit}
            >
              ส่งใบเสร็จ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReceiptCameraModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [receiptOptions, setReceiptOptions] =
    useState<OpenReceiptOptions | null>(null);
  const previousOverflowRef = useRef<string | null>(null);

  const closeReceipt = useCallback(() => {
    setReceiptOptions(null);
  }, []);

  const openReceipt = useCallback((options: OpenReceiptOptions = {}) => {
    setReceiptOptions(options);
  }, []);

  const handleModalClose = useCallback(() => {
    receiptOptions?.onClose?.();
    closeReceipt();
  }, [receiptOptions, closeReceipt]);

  useEffect(() => {
    if (receiptOptions && previousOverflowRef.current === null) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    if (!receiptOptions && previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
    }
  }, [receiptOptions]);

  useEffect(() => {
    return () => {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
    };
  }, []);

  return (
    <ReceiptCameraModalContext.Provider value={{ openReceipt, closeReceipt }}>
      {receiptOptions && (
        <ReceiptCameraModal
          options={receiptOptions}
          onClose={handleModalClose}
        />
      )}
      {children}
    </ReceiptCameraModalContext.Provider>
  );
}

export function useReceiptCameraModalContext() {
  const context = useContext(ReceiptCameraModalContext);
  if (!context) {
    throw new Error(
      "useReceiptCameraModalContext must be used within ReceiptCameraModalProvider",
    );
  }
  return context;
}
