"use client";
import Profile from "@/components/profile";
import { useApp } from "@/components/providers/app-provider";
import { CouponType, isErrorResponse } from "@/types/request";
import { useEffect, useState } from "react";

export default function Page() {
  const { backendClient, clientConfig, userPoint } = useApp();
  const [coupons, setCoupons] = useState<CouponType[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const coupon = await backendClient.listCoupon(clientConfig.slug);
    if (isErrorResponse(coupon)) {
      return;
    }
    setCoupons(coupon);
  };

  return (
    <div className="px-5 pt-4">
      <Profile />

      <div
        className="text-2xl my-5"
        style={{ color: clientConfig.ui.primary_color }}
      >
        สิทธิพิเศษทั้งหมด
      </div>

      <div className="flex flex-col gap-4">
        {coupons.map((coupon, index) => {
          const currentPoint =
            userPoint.find((point) => point.currency.id === coupon.currency.id)
              ?.balance || 0;
          const canUse = currentPoint >= coupon.value;

          return (
            <div
              className="flex gap-4 rounded-md overflow-hidden cursor-pointer shadow-md"
              key={index}
              onClick={() => {
                window.location.href = `/${clientConfig.slug}/coupon/${coupon.id}`;
              }}
              style={{
                backgroundColor: clientConfig.ui.background_white_color,
                color: clientConfig.ui.text_color,
                opacity: canUse ? 1 : 0.7,
              }}
            >
              <img
                src={coupon.image_url || clientConfig.logo_url}
                alt="ads"
                className="w-30 h-30 object-contain"
              />

              <div className="py-2 flex flex-col flex-1">
                <div
                  className="text-2xl line-clamp-1"
                  style={{ color: clientConfig.ui.primary_color }}
                >
                  {coupon.name}
                </div>

                <div
                  className="flex gap-1"
                  style={{ color: clientConfig.ui.text_gray_color }}
                >
                  ใช้ {coupon.value.toLocaleString()}{" "}
                  {coupon.currency.name.toLocaleUpperCase()}{" "}
                  {!canUse && "(คะแนนไม่พอ)"}
                </div>

                <div className="mt-auto">แลกได้ถึง {coupon.end_time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
