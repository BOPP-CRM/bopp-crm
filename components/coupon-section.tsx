import { CouponType, isErrorResponse } from "@/types/request";
import React, { useEffect, useState } from "react";
import { useApp } from "./providers/app-provider";
import CouponCard from "./coupon-card";
import { useRouter } from "next/navigation";

export default function CouponSection() {
  const { backendClient, clientConfig, userPoint } = useApp();
  const router = useRouter();
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
    <section className="mx-4.5 mb-5.5">
      <div
        className="text-xl leading-none font-medium font-bodoni mb-4"
        style={{ color: clientConfig.ui.text_color }}
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
            <CouponCard
              key={index}
              coupon={coupon}
              canUse={canUse}
              onClick={() => {
                router.push(`/${clientConfig.slug}/coupon/${coupon.id}`);
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
