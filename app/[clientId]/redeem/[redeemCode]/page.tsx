"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Button from "@/components/button";
import { useApp } from "@/components/providers/app-provider";
import { Sk } from "@/components/skeleton";
import { isErrorResponse, Redeem } from "@/types/request";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "tabler-icons-react";
import { formatDate } from "@/util/format-date";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const {
    backendClient,
    clientConfig,
    userProfile,
    setIsShowNavbar,
    openAlert,
    setFullLoading,
  } = useApp();
  const redeemCode = Array.isArray(params.redeemCode)
    ? params.redeemCode[0]
    : params.redeemCode;
  const [redeemDetail, setRedeemDetail] = useState<Redeem>();

  useEffect(() => {
    Promise.resolve().then(() => setIsShowNavbar(false));
    return () => {
      setIsShowNavbar(true);
    };
  }, [setIsShowNavbar]);

  const fetchData = useCallback(async () => {
    if (!redeemCode) return;

    const redeemDetail = await backendClient.getRedeemDetail(
      clientConfig.slug,
      redeemCode,
    );
    if (isErrorResponse(redeemDetail)) {
      window.location.href = `/${clientConfig.slug}`;
      return;
    }
    if (redeemDetail) {
      setRedeemDetail(redeemDetail);
    }
  }, [backendClient, clientConfig.slug, redeemCode]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (!redeemDetail) {
    const line = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 22%, transparent)`;
    const surface = clientConfig.ui.surface_color;
    const border = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`;
    return (
      <div
        className="min-h-screen relative px-4.5 pt-4.5 pb-28"
        style={{ backgroundColor: clientConfig.ui.background_color }}
      >
        <Sk className="h-10 w-10 rounded-full" bg={surface} />
        <Sk className="mt-4 h-116 w-full rounded-2xl" bg={surface} />
        <Sk
          className="mt-5 h-9 rounded-lg"
          bg={line}
          style={{ width: "72%" }}
        />
        <Sk className="mt-1 h-3 w-28" bg={line} />
        <div
          className="mt-5 rounded-3xl border-[0.5px]"
          style={{ background: surface, borderColor: border }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-5 flex justify-between items-center ${i > 1 ? "border-t-[0.5px]" : ""}`}
              style={{ borderColor: border }}
            >
              <Sk className="h-4 w-16" bg={line} />
              <Sk className="h-4 w-24" bg={line} />
            </div>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 z-30 w-full p-4">
          <Sk className="h-14 rounded-2xl" bg={surface} />
        </div>
      </div>
    );
  }

  const onReedeem = async () => {
    if (!redeemCode || !userProfile?.userId) return;

    setFullLoading(true);

    const response = await backendClient.redeemCode(
      clientConfig.slug,
      redeemCode,
      userProfile?.userId,
    );

    setFullLoading(false);

    if (isErrorResponse(response)) {
      await openAlert({
        title: "เกิดข้อผิดพลาด",
        message: response.message,
        onConfirm: () => {
          router.push(`/${clientConfig.slug}`);
        },
      });
      return;
    }

    const isCouponRedeem = Boolean(response.coupon);
    await openAlert({
      title: "สำเร็จ",
      message: isCouponRedeem ? "รับคูปองสำเร็จแล้ว!" : "สะสมคะแนนสำเร็จแล้ว!",
      onConfirm: () => {
        if (response.coupon) {
          router.push(`/${clientConfig.slug}/coupon/my/${response.coupon.id}`);
          return;
        }
        router.push(`/${clientConfig.slug}/coupon/my`);
      },
    });
  };

  return (
    <div
      className="min-h-screen relative px-4.5 pt-4.5 pb-28"
      style={{
        backgroundColor: clientConfig.ui.background_color,
        color: clientConfig.ui.text_color,
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => router.push(`/${clientConfig.slug}`)}
        className="rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm shrink-0"
        style={{ backgroundColor: clientConfig.ui.surface_color }}
      >
        <ChevronLeft size={24} color={clientConfig.ui.text_color} />
      </button>

      <div className="mt-4">
        <div
          className="text-[32px] font-medium font-bodoni"
          style={{ color: clientConfig.ui.text_color }}
        >
          {redeemDetail?.name || "—"}
        </div>
        {redeemDetail.expiration_date && (
          <p
            className="text-[10px] font-semibold font-mono"
            style={{ color: clientConfig.ui.primary_color }}
          >
            แลกได้ถึง {formatDate(redeemDetail.expiration_date, {}, true)}
          </p>
        )}

        {redeemDetail.reward_coupon && (
          <div
            className="mt-4 p-3 flex gap-4 items-center rounded-[18px] overflow-hidden cursor-pointer shadow-md border-[0.5px]"
            style={{
              backgroundColor: clientConfig.ui.surface_color,
              color: clientConfig.ui.text_color,
              borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
            }}
          >
            <img
              src={
                redeemDetail.reward_coupon.image_url || clientConfig.logo_url
              }
              alt="ads"
              className="w-14 h-14 object-cover rounded-[10px]"
            />

            <div className="flex flex-col flex-1">
              <p
                className="line-clamp-1 font-bodoni font-medium"
                style={{ color: clientConfig.ui.text_color }}
              >
                {redeemDetail.reward_coupon.name}
              </p>

              <p className="">
                <span
                  className="text-[10px] mr-2 font-semibold leading-[1.3] line-through"
                  style={{ color: clientConfig.ui.text_gray_color }}
                >
                  {redeemDetail.reward_coupon.value.toLocaleString()}{" "}
                  {redeemDetail.currency.name.toLocaleUpperCase()}
                </span>
              </p>
            </div>
            <p
              style={{ color: clientConfig.ui.primary_color }}
              className="text-sm mr-2 font-semibold leading-[1.3]"
            >
              FREE
            </p>
          </div>
        )}

        {redeemDetail.value > 0 && (
          <div
            className="mt-4 p-3 flex gap-4 items-center rounded-[18px] overflow-hidden cursor-pointer shadow-md border-[0.5px]"
            style={{
              backgroundColor: clientConfig.ui.surface_color,
              color: clientConfig.ui.text_color,
              borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
            }}
          >
            <img
              src={clientConfig.logo_url}
              alt="ads"
              className="w-14 h-14 object-cover rounded-[10px]"
            />

            <div className="flex flex-col flex-1">
              <p
                className="line-clamp-1 font-bodoni font-medium"
                style={{ color: clientConfig.ui.text_color }}
              >
                รับ {redeemDetail.value.toLocaleString()}{" "}
                {redeemDetail.currency.name.toLocaleUpperCase()}
              </p>
            </div>
            <p
              style={{ color: clientConfig.ui.primary_color }}
              className="text-sm mr-2 font-semibold leading-[1.3]"
            >
              FREE
            </p>
          </div>
        )}
      </div>
      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 z-30 w-full p-4">
        <Button text="กดรับคูปอง" onClick={onReedeem} />
      </div>
    </div>
  );
}
