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
import {
  detectReceiptFrame,
  type DetectedReceiptFrame,
  type ReceiptPoint,
} from "@/util/receipt-frame-detection";
import {
  createDefaultCropPoints,
  cropReceiptImage,
  mapDetectionPointsToImage,
} from "@/util/receipt-image-crop";
import { ReceiptCropEditor } from "@/components/receipt-crop-editor";

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

const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

const CAMERA_VIDEO_FALLBACK_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
};

const JPEG_CAPTURE_QUALITY = 0.95;
const DETECTION_FRAME_INTERVAL_MS = 200;
const DETECTION_MAX_WIDTH = 480;

async function applyHighResolutionConstraints(track: MediaStreamTrack) {
  const capabilities = track.getCapabilities?.();
  if (!capabilities?.width || !capabilities?.height) return;

  const targetWidth = Math.min(capabilities.width.max ?? 1920, 1920);
  const targetHeight = Math.min(capabilities.height.max ?? 1080, 1080);

  try {
    await track.applyConstraints({
      width: { ideal: targetWidth },
      height: { ideal: targetHeight },
    });
  } catch (error) {
    console.warn("Could not apply camera resolution constraints", error);
  }
}

async function waitForVideoReady(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return;

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      video.removeEventListener("loadedmetadata", onReady);
      reject(new Error("Video metadata timeout"));
    }, 8000);

    const onReady = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadedmetadata", onReady);
      resolve();
    };

    video.addEventListener("loadedmetadata", onReady);
  });
}

async function requestCameraStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: CAMERA_VIDEO_CONSTRAINTS,
      audio: false,
    });
  } catch (error) {
    console.warn("High-resolution camera request failed, retrying", error);
    return navigator.mediaDevices.getUserMedia({
      video: CAMERA_VIDEO_FALLBACK_CONSTRAINTS,
      audio: false,
    });
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read image"));
        return;
      }
      resolve(result.replace(/^data:image\/\w+;base64,/, ""));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

async function captureFromVideo(video: HTMLVideoElement): Promise<string> {
  await waitForVideoReady(video);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Video is not ready");
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_CAPTURE_QUALITY);
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}

async function capturePhoto(
  stream: MediaStream,
  video: HTMLVideoElement,
): Promise<string> {
  const track = stream.getVideoTracks()[0];
  if (track && "ImageCapture" in window) {
    try {
      const imageCapture = new ImageCapture(track);
      const blob = await imageCapture.takePhoto();
      return blobToBase64(blob);
    } catch (error) {
      console.warn("ImageCapture failed, falling back to video frame", error);
    }
  }

  return captureFromVideo(video);
}

async function loadCapturedImage(
  base64Image: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => reject(new Error("Failed to load captured image"));
    image.src = `data:image/jpeg;base64,${base64Image}`;
  });
}

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
  const [rawReceiptImage, setRawReceiptImage] = useState("");
  const [croppedReceiptImage, setCroppedReceiptImage] = useState("");
  const [postCaptureStep, setPostCaptureStep] = useState<"crop" | "submit">("crop");
  const [cropPoints, setCropPoints] = useState<ReceiptPoint[]>([]);
  const [imageDimensions, setImageDimensions] = useState({
    width: 1,
    height: 1,
  });
  const [cameraError, setCameraError] = useState("");
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [detectedReceiptFrame, setDetectedReceiptFrame] =
    useState<DetectedReceiptFrame | null>(null);
  const [detectionSize, setDetectionSize] = useState({ width: 1, height: 1 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestIdRef = useRef(0);
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionTimeoutRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    cameraRequestIdRef.current += 1;

    if (detectionTimeoutRef.current !== null) {
      window.clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setIsCameraStarting(false);
    setIsCameraReady(false);
    setDetectedReceiptFrame(null);
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = ++cameraRequestIdRef.current;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      setCameraError("");
      setIsCameraStarting(true);
      setIsCameraReady(false);

      const stream = await requestCameraStream();

      if (requestId !== cameraRequestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      try {
        await video.play();
        await waitForVideoReady(video);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }

      if (requestId !== cameraRequestIdRef.current) {
        return;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        void applyHighResolutionConstraints(videoTrack).catch((error) => {
          console.warn("Could not upgrade camera resolution", error);
        });
      }

      setIsCameraReady(true);
      setIsCameraStarting(false);
    } catch (error) {
      if (requestId !== cameraRequestIdRef.current) {
        return;
      }

      console.error(error);
      setCameraError("ไม่สามารถเปิดกล้องได้");
      setIsCameraStarting(false);
      setIsCameraReady(false);
    }
  }, []);

  const runReceiptDetection = useCallback(() => {
    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;

    if (!video || !canvas || rawReceiptImage) return;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      detectionTimeoutRef.current = window.setTimeout(
        runReceiptDetection,
        DETECTION_FRAME_INTERVAL_MS,
      );
      return;
    }

    const scale = Math.min(1, DETECTION_MAX_WIDTH / Math.max(video.videoWidth, 1));
    const targetWidth = Math.max(1, Math.round(video.videoWidth * scale));
    const targetHeight = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(video, 0, 0, targetWidth, targetHeight);

    try {
      const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
      const frame = detectReceiptFrame(imageData);
      setDetectedReceiptFrame(frame);
      setDetectionSize({ width: targetWidth, height: targetHeight });
    } catch (error) {
      console.warn("Receipt detection failed", error);
    }

    detectionTimeoutRef.current = window.setTimeout(
      runReceiptDetection,
      DETECTION_FRAME_INTERVAL_MS,
    );
  }, [rawReceiptImage]);

  useEffect(() => {
    if (rawReceiptImage) return;

    void startCamera();

    return () => {
      stopCamera();
    };
  }, [rawReceiptImage, startCamera, stopCamera]);

  useEffect(() => {
    if (!rawReceiptImage && isCameraReady && streamRef.current) {
      runReceiptDetection();
    }

    return () => {
      if (detectionTimeoutRef.current !== null) {
        window.clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
    };
  }, [isCameraReady, rawReceiptImage, runReceiptDetection]);

  const handleCapture = async () => {
    try {
      const video = videoRef.current;
      const stream = streamRef.current;
      if (!video || !stream) return;

      const base64Image = await capturePhoto(stream, video);
      const dimensions = await loadCapturedImage(base64Image);
      const initialCropPoints = detectedReceiptFrame
        ? mapDetectionPointsToImage(
            detectedReceiptFrame.points,
            detectionSize.width,
            detectionSize.height,
            dimensions.width,
            dimensions.height,
          )
        : createDefaultCropPoints(dimensions.width, dimensions.height);

      setRawReceiptImage(base64Image);
      setCroppedReceiptImage("");
      setPostCaptureStep("crop");
      setImageDimensions(dimensions);
      setCropPoints(initialCropPoints);
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
    setRawReceiptImage("");
    setCroppedReceiptImage("");
    setPostCaptureStep("crop");
    setCropPoints([]);
    setImageDimensions({ width: 1, height: 1 });
  };

  const handleConfirmCrop = async () => {
    if (!rawReceiptImage || cropPoints.length !== 4) return;

    try {
      setFullLoading(true);
      const cropped = await cropReceiptImage(rawReceiptImage, cropPoints);
      setCroppedReceiptImage(cropped);
      setPostCaptureStep("submit");
    } catch (error) {
      console.error(error);
      await openAlert({
        title: "ตัดกรอบไม่สำเร็จ",
        message: "ไม่สามารถตัดกรอบใบเสร็จได้ กรุณาลองใหม่",
        icon: <IconAlertTriangle size={24} />,
      });
    } finally {
      setFullLoading(false);
    }
  };

  const handleBackToCrop = () => {
    setPostCaptureStep("crop");
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

    if (!croppedReceiptImage) {
      await openAlert({
        title: "ข้อมูลไม่ครบ",
        message: "กรุณายืนยันกรอบใบเสร็จก่อน",
        icon: <IconAlertTriangle size={24} />,
      });
      return;
    }

    try {
      setFullLoading(true);

      const result = await options.onSubmit?.({
        receiptNumber: receiptNumber.trim(),
        receiptImage: croppedReceiptImage,
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
      <canvas ref={detectionCanvasRef} className="hidden" />
      {!rawReceiptImage ? (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-black/20" />
            {detectedReceiptFrame ? (
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${detectionSize.width} ${detectionSize.height}`}
                preserveAspectRatio="none"
              >
                <polygon
                  points={detectedReceiptFrame.points
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill={`color-mix(in srgb, ${primaryColor} 18%, transparent)`}
                  stroke={primaryColor}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : (
              <div
                className="absolute inset-[12%] rounded-[28px] border-2 border-dashed"
                style={{ borderColor: `${primaryColor}99` }}
              />
            )}
          </div>

          {!!cameraError && (
            <div className="absolute left-4 right-4 top-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-400">
              {cameraError}
            </div>
          )}

          <div className="absolute inset-x-4 top-16 flex justify-center">
            <div className="rounded-full bg-black/55 px-4 py-2 text-sm text-white">
              {isCameraStarting
                ? "กำลังขอสิทธิ์และเปิดกล้อง..."
                : !isCameraReady
                  ? "กำลังเตรียมกล้อง..."
                  : detectedReceiptFrame
                    ? "พบกรอบใบเสร็จแล้ว"
                    : "กำลังหาใบเสร็จในภาพ"}
            </div>
          </div>

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
      ) : postCaptureStep === "crop" ? (
        <div className="relative flex h-full w-full flex-col">
          <div className="relative z-0 min-h-0 flex-1 overflow-hidden bg-black">
            <button
              type="button"
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white"
              onClick={onClose}
            >
              <IconX size={18} />
            </button>

            <ReceiptCropEditor
              imageBase64={rawReceiptImage}
              imageWidth={imageDimensions.width}
              imageHeight={imageDimensions.height}
              points={cropPoints}
              primaryColor={primaryColor}
              onPointsChange={setCropPoints}
            />
          </div>

          <div
            className="relative z-20 shrink-0 rounded-t-[22px] px-4 pt-6 pb-[max(env(safe-area-inset-bottom),24px)]"
            style={{ background: clientConfig?.ui?.surface_color }}
          >
            <p
              className="mb-4 text-center text-sm"
              style={{ color: clientConfig?.ui?.text_gray_color }}
            >
              ลากมุมหรือขอบสีเพื่อปรับกรอบใบเสร็จ หรือใช้สองนิ้วซูมเพื่อดูใกล้ขึ้น
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="h-14 flex-1 rounded-[14px] border text-[15px]"
                style={{
                  borderColor: textGrayColor,
                  color: clientConfig?.ui?.text_color,
                }}
                onClick={handleRetake}
              >
                ถ่ายใหม่
              </button>
              <button
                type="button"
                className="h-14 flex-2 rounded-[14px] text-[15px] font-medium"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  color: clientConfig?.ui?.button_text_color || textWhiteColor,
                }}
                onClick={() => void handleConfirmCrop()}
              >
                ยืนยันกรอบ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex h-full w-full flex-col">
          <button
            type="button"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white"
            onClick={onClose}
          >
            <IconX size={18} />
          </button>

          <img
            src={`data:image/jpeg;base64,${croppedReceiptImage}`}
            alt="receipt-preview"
            className="min-h-0 flex-1 bg-black object-contain"
          />

          <div
            className="shrink-0 rounded-t-[22px] px-4 pt-8 pb-6"
            style={{ background: clientConfig?.ui?.surface_color }}
          >
            <div
              className="mb-3 flex justify-between"
              style={{
                color: clientConfig?.ui.text_color,
              }}
            >
              <p className="block text-lg font-semibold">เลขใบเสร็จ</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={handleBackToCrop}
                >
                  <p>แก้กรอบ</p>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={handleRetake}
                >
                  <IconCamera size={20} />
                  <p>ถ่ายใหม่</p>
                </button>
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
              className="mt-5 flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-[14px] p-2 text-center text-[15px]"
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
