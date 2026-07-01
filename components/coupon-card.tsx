import React from "react";
import { useApp } from "./providers/app-provider";
import { CouponType } from "@/types/request";
import { formatDate } from "@/util/format-date";

interface CouponCardProps {
  coupon: CouponType;
  canUse: boolean;
  onClick?: () => void;
}

export default function CouponCard({
  coupon,
  canUse,
  onClick,
}: CouponCardProps) {
  const { clientConfig } = useApp();

  return (
    <div
      className="p-3 flex gap-4 items-center rounded-[18px] overflow-hidden cursor-pointer shadow-md border-[0.5px]"
      onClick={onClick}
      style={{
        backgroundColor: clientConfig.ui.surface_color,
        color: clientConfig.ui.text_color,
        opacity: canUse ? 1 : 0.7,
        borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
      }}
    >
      <img
        src={coupon.image_url || clientConfig.logo_url}
        alt="ads"
        className="w-14 h-14 object-cover rounded-[10px]"
      />

      <div className="flex flex-col flex-1">
        <p
          className="line-clamp-1 font-bodoni font-medium"
          style={{ color: clientConfig.ui.text_color }}
        >
          {coupon.name}
        </p>

        <p
          className="flex gap-1 text-xs tracking-[1.3] text-[11.5px]"
          style={{ color: clientConfig.ui.text_gray_color }}
        >
          ใช้ {coupon.value.toLocaleString()}{" "}
          {coupon.currency.name.toLocaleUpperCase()} {!canUse && "(คะแนนไม่พอ)"}
        </p>

        <p className="">
          <span
            className="text-[10px] mr-2 font-semibold leading-[1.3]"
            style={{ color: clientConfig.ui.primary_color }}
          >
            {coupon.value.toLocaleString()}{" "}
            {coupon.currency.name.toLocaleUpperCase()}
          </span>
          {coupon.end_time && (
            <span
              className="text-[10px]"
              style={{ color: clientConfig.ui.text_gray_color }}
            >
              หมดอายุ {formatDate(coupon.end_time, {}, true)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
