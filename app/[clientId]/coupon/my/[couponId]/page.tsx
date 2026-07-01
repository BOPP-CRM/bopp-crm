"use client";

/* eslint-disable react-hooks/set-state-in-effect */

/* eslint-disable @next/next/no-img-element */

import Button from "@/components/button";
import { useApp } from "@/components/providers/app-provider";
import { Sk } from "@/components/skeleton";
import { isErrorResponse, UserCoupon } from "@/types/request";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "tabler-icons-react";
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { formatDate } from "@/util/format-date";
import {
  IconCopy,
  IconMoodSadFilled,
  IconMoodSmileDizzy,
} from "@tabler/icons-react";

function parseUtcExpiration(dateStr: string): Date {
  return new Date(dateStr.replace(" ", "T"));
}

function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function getRemainingSeconds(expirationDate: string): number {
  const expiration = parseUtcExpiration(expirationDate);
  return Math.floor((expiration.getTime() - Date.now()) / 1000);
}

function isCouponExpired(coupon: UserCoupon): boolean {
  if (coupon.state !== "expired" || !coupon.expiration_date) {
    return false;
  }

  return getRemainingSeconds(coupon.expiration_date) <= 0;
}

export default function Page() {
  const params = useParams();
  const router = useRouter();

  const {
    backendClient,
    clientConfig,
    userProfile,
    setIsShowNavbar,
    openAlert,
  } = useApp();

  const couponId = Array.isArray(params.couponId)
    ? params.couponId[0]
    : params.couponId;

  const [coupon, setCoupon] = useState<UserCoupon>();
  const [codeType, setCodeType] = useState<"qr" | "bar">("qr");
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile || !couponId) {
      return;
    }

    const coupon = await backendClient.getUserCouponById(
      clientConfig.slug,
      couponId,
    );

    if (isErrorResponse(coupon)) {
      window.location.href = `/${clientConfig.slug}`;
      return;
    }

    setCoupon(coupon);
  }, [backendClient, clientConfig.slug, couponId, userProfile]);

  useEffect(() => {
    setIsShowNavbar(false);

    void fetchData();

    return () => {
      setIsShowNavbar(true);
    };
  }, [fetchData, setIsShowNavbar]);

  useEffect(() => {
    if (
      coupon?.state !== "activated" ||
      !coupon.expiration_date ||
      coupon.is_used
    ) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      setRemainingSeconds(
        getRemainingSeconds(coupon.expiration_date as string),
      );
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [coupon?.expiration_date, coupon?.is_used, coupon?.state]);

  if (!coupon) {
    const line = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 22%, transparent)`;
    const surface = clientConfig.ui.surface_color;
    const border = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`;
    return (
      <div
        className="min-h-screen relative pt-4.5 px-4.5 pb-20"
        style={{ backgroundColor: clientConfig.ui.background_color }}
      >
        <Sk className="h-10 w-10 rounded-full" bg={surface} />
        <Sk className="mt-4 h-116 w-full rounded-2xl" bg={surface} />
        <Sk
          className="mt-8 h-9 rounded-lg"
          bg={line}
          style={{ width: "72%" }}
        />
        <div
          className="mt-5 rounded-3xl border-[0.5px]"
          style={{ background: surface, borderColor: border }}
        >
          <div
            className="p-5 flex justify-between items-center border-b-[0.5px]"
            style={{ borderColor: border }}
          >
            <Sk className="h-4 w-16" bg={line} />
            <Sk className="h-4 w-24" bg={line} />
          </div>
          <div className="p-5 flex justify-between items-center">
            <Sk className="h-4 w-16" bg={line} />
            <Sk className="h-4 w-20" bg={line} />
          </div>
        </div>
        <Sk className="mt-8 mb-3 h-3 w-12" bg={line} />
        {[90, 75, 85, 55].map((w, i) => (
          <Sk
            key={i}
            className="h-3 mb-2.5"
            bg={line}
            style={{ width: `${w}%` }}
          />
        ))}
        <div className="fixed bottom-0 left-0 z-30 w-full p-4">
          <Sk className="h-14 rounded-2xl" bg={surface} />
        </div>
      </div>
    );
  }

  const isActivated = coupon.state === "activated";
  const expired = isCouponExpired(coupon);

  const onActivateCoupon = async () => {
    if (!coupon?.code) {
      return;
    }

    const response = await backendClient.activateCoupon(
      clientConfig.slug,
      coupon.code,
    );

    if (isErrorResponse(response)) {
      openAlert({
        title: "เปิดใช้งานคูปองไม่สำเร็จ",
        message: response.message,
        icon: <IconMoodSadFilled />,
      });
      return;
    }

    setCoupon(response);
  };

  const onUseCoupon = async () => {
    if (!userProfile || !couponId || !coupon) {
      return;
    }

    const response = await backendClient.onUseCoupon(
      clientConfig.slug,
      coupon.code,
    );

    if (isErrorResponse(response)) {
      openAlert({
        title: "ใช้คูปองไม่สำเร็จ",
        message: response.message,
        icon: <IconMoodSadFilled />,
      });
      return;
    }

    openAlert({
      title: "ใช้คูปองสำเร็จ",
      message: `คุณได้ใช้คูปอง ${coupon.name} เรียบร้อยแล้ว`,
      icon: <IconMoodSmileDizzy />,
      onConfirm: () => {
        fetchData();
      },
    });

    setCoupon(response);
  };

  const onCopyCode = async () => {
    if (!coupon?.code) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(coupon.code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = coupon.code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className="min-h-screen relative pt-4.5 px-4.5 pb-20"
      style={{
        backgroundColor: clientConfig.ui.background_color,
        color: clientConfig.ui.text_color,
      }}
    >
      {/* Back */}
      <button
        onClick={() => router.push(`/${clientConfig.slug}/coupon/my`)}
        className="rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm shrink-0"
        style={{
          backgroundColor: clientConfig.ui.surface_color,
        }}
      >
        <ChevronLeft size={24} color={clientConfig.ui.text_color} />
      </button>

      {/* Image */}
      <img
        src={coupon?.coupon.image_url || clientConfig.logo_url}
        alt="coupon"
        className="mt-4 w-full aspect-square rounded-2xl object-cover"
        style={{
          backgroundColor: clientConfig.ui.background_white_color,
        }}
      />

      {coupon?.is_used ? (
        <div
          className="mt-8 text-md font-medium font-bodoni rounded-full w-fit px-4 py-2"
          style={{
            color: clientConfig.ui.primary_color,
            backgroundColor: clientConfig.ui.primary_color + "33",
          }}
        >
          ใช้คูปองแล้ว
        </div>
      ) : expired ? (
        <div
          className="mt-8 text-md font-medium font-bodoni rounded-full w-fit px-4 py-2"
          style={{
            color: clientConfig.ui.primary_color,
            backgroundColor: clientConfig.ui.primary_color + "33",
          }}
        >
          คูปองหมดอายุ
        </div>
      ) : null}

      <div
        className="mt-8 text-[32px] font-medium font-bodoni"
        style={{
          color: clientConfig.ui.text_white_color,
        }}
      >
        {coupon?.name}
      </div>
      {coupon?.is_used && coupon.used_date && (
        <div
          className="mt-1 text-[13px]"
          style={{
            color: clientConfig.ui.text_gray_color,
          }}
        >
          ใช้เมื่อ {formatDate(coupon.used_date)}
        </div>
      )}

      {coupon.state === "redeemed" && (
        <div
          className="mt-5 rounded-3xl border-[0.5px] text-[13px]"
          style={{
            backgroundColor: clientConfig.ui.surface_color,
            borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
          }}
        >
          <div
            className="p-5 mt-1 flex items-center justify-between text-lg border-b-[0.5px] text-[13px]"
            style={{
              borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
            }}
          >
            <p
              style={{
                color: clientConfig.ui.text_gray_color,
              }}
            >
              ใช้แต้ม
            </p>
            <p
              style={{
                color: clientConfig.ui.text_color,
              }}
            >
              {coupon?.value} {coupon?.currency.name.toUpperCase()}
            </p>
          </div>
          <div className="p-5 mt-1 flex items-center justify-between text-lg text-[13px]">
            <p
              style={{
                color: clientConfig.ui.text_gray_color,
              }}
            >
              หมดอายุ
            </p>
            <p
              style={{
                color: clientConfig.ui.text_color,
              }}
            >
              เริ่มนับเมื่อกดใช้สิทธิ์
            </p>
          </div>
        </div>
      )}

      {coupon?.code && isActivated && !coupon.is_used && (
        <div className="flex flex-col items-center">
          {/* Toggle */}
          <div
            className="flex rounded-full overflow-hidden my-5"
            style={{
              backgroundColor: clientConfig.ui.surface_color,
            }}
          >
            <button
              onClick={() => setCodeType("qr")}
              className="px-5 py-2 cursor-pointer font-medium"
              style={{
                backgroundColor:
                  codeType === "qr"
                    ? clientConfig.ui.primary_color
                    : clientConfig.ui.surface_color,

                color: codeType === "qr" ? "#fff" : clientConfig.ui.text_color,
              }}
            >
              QR Code
            </button>

            <button
              onClick={() => setCodeType("bar")}
              className="px-5 py-2 cursor-pointer font-medium"
              style={{
                backgroundColor:
                  codeType === "bar"
                    ? clientConfig.ui.primary_color
                    : clientConfig.ui.surface_color,

                color: codeType === "bar" ? "#fff" : clientConfig.ui.text_color,
              }}
            >
              Barcode
            </button>
          </div>

          {/* Code */}
          <div
            className="mt-5.5 mb-3.5 flex min-h-62.5 w-fit items-center justify-center rounded-[18px] p-3"
            style={{
              backgroundColor: clientConfig.ui.background_white_color,
              boxShadow: `0 0 0 1px ${clientConfig.ui.primary_color}, 0 0 40px -10px color-mix(in oklch, ${clientConfig.ui.primary_color} 70%, transparent)`,
            }}
          >
            {codeType === "qr" ? (
              <QRCode
                value={coupon.code}
                size={240}
                bgColor={clientConfig.ui.surface_color}
                fgColor={clientConfig.ui.text_color}
              />
            ) : (
              <Barcode
                value={coupon.code}
                format="CODE128"
                width={1.5}
                height={80}
                displayValue={false}
              />
            )}
          </div>

          {remainingSeconds !== null && (
            <div className="mb-5 text-center">
              <div
                className="text-[10px]"
                style={{ color: clientConfig.ui.text_gray_color }}
              >
                เหลือเวลาใช้งาน
              </div>
              <div
                className="mt-1 text-5xl font-bodoni font-bold tracking-wider"
                style={{
                  color:
                    remainingSeconds > 0
                      ? clientConfig.ui.primary_color
                      : clientConfig.ui.text_error_color,
                }}
              >
                {formatCountdown(remainingSeconds)}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onCopyCode}
            className="mt-1 mb-8 flex w-full items-center justify-center rounded-3xl border-[0.5px] p-5 text-[13px] text-lg font-semibold font-mono tracking-[0.06em]"
            style={{
              backgroundColor: clientConfig.ui.surface_color,
              borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
              color: clientConfig.ui.primary_color,
            }}
          >
            <p className="w-full text-center">{coupon.code}</p>
            <span className="flex items-center gap-1">
              <IconCopy size={18} className="active:text-white" />
            </span>
          </button>
        </div>
      )}

      {/* Terms */}
      {(!isActivated || coupon?.is_used) && (
        <>
          <p
            className="mt-8 text-[10px] font-semibold"
            style={{ color: clientConfig.ui.text_gray_color }}
          >
            เงื่อนไข
          </p>
          <div
            className="whitespace-pre-line leading-8 min-h-56 text-[11.5px]"
            style={{
              color: clientConfig.ui.text_gray_color,
            }}
          >
            {coupon?.coupon.term_and_condition || "-"}
          </div>
        </>
      )}

      {/* Bottom Button */}
      <div
        className="fixed bottom-0 left-0 z-30 w-full p-4 shadow-lg"
        style={{
          backgroundColor: clientConfig.ui.background_color,
        }}
      >
        {coupon?.is_used ? (
          <Button text="คุณใช้คูปองนี้เรียบร้อยแล้ว" disabled />
        ) : expired ? (
          <Button text="หมดอายุ" disabled />
        ) : coupon.state === "activated" ? (
          <Button text="ใช้สิทธิ์แล้ว" onClick={onUseCoupon} />
        ) : (
          <Button
            text="ใช้สิทธิ์"
            onClick={() => {
              openAlert({
                title: "ยืนยันการใช้สิทธิ์",
                message: "เมื่อยืนยันแล้ว เวลาใช้งานจะเริ่มนับถอยหลัง",
                hasCancel: true,
                onConfirm: onActivateCoupon,
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
