"use client";
import ChipButton from "@/components/chip-button";
import CouponCard from "@/components/coupon-card";
import { useApp } from "@/components/providers/app-provider";
import { Sk } from "@/components/skeleton";
import { CouponType, isErrorResponse, UserCoupon } from "@/types/request";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Ticket } from "tabler-icons-react";

export default function Page() {
  const { clientConfig, backendClient, userProfile } = useApp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "available" | "used" | "expired"
  >("available");

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) {
        setIsLoading(false);
        return;
      }

      const response = await backendClient.getUserCoupon(clientConfig.slug);

      if (isErrorResponse(response)) {
        window.location.href = `/${clientConfig.slug}`;
        return;
      }

      setUserCoupons(response);
      setIsLoading(false);
    };

    Promise.resolve().then(fetchData);
  }, [backendClient, clientConfig.slug, userProfile]);

  const canUseCoupon = userCoupons.filter((item) => {
    if (item.is_used) return false;
    if (item.state === "redeemed") return true;
    if (!item.expiration_date) return true;

    const expiration = new Date(item.expiration_date.replace(" ", "T"));

    return expiration > new Date();
  });

  const usedCoupon = userCoupons.filter((item) => item.is_used);

  const expiredCoupon = userCoupons.filter((item) => {
    if (item.is_used) return false;
    if (item.state === "expired") return true;
    if (!item.expiration_date) return false;

    const expiration = new Date(item.expiration_date.replace(" ", "T"));

    return expiration < new Date();
  });

  const displayCoupons =
    selectedTab === "available"
      ? canUseCoupon
      : selectedTab === "used"
        ? usedCoupon
        : expiredCoupon;

  if (isLoading) {
    const line = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 22%, transparent)`;
    return (
      <div className="px-5 pt-4">
        <Sk className="h-9 w-44 mt-5 mb-5" bg={line} />
        <div className="flex gap-2 mb-5">
          {[80, 72, 80].map((w, i) => (
            <Sk
              key={i}
              className="h-8 rounded-full"
              bg={line}
              style={{ width: w }}
            />
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Sk
              key={i}
              className="h-24 rounded-[18px]"
              bg={clientConfig.ui.surface_color}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4">
      <div
        className="text-2xl font-medium mt-5 mb-2 font-bodoni pb-4.5"
        style={{ color: clientConfig.ui.text_color }}
      >
        คูปองของฉัน
      </div>

      <div className="flex gap-2">
        <ChipButton
          label={`ใช้ได้ (${canUseCoupon.length})`}
          selected={selectedTab === "available"}
          onSelect={() => setSelectedTab("available")}
        />
        <ChipButton
          label={`ใช้แล้ว (${usedCoupon.length})`}
          selected={selectedTab === "used"}
          onSelect={() => setSelectedTab("used")}
        />
        <ChipButton
          label={`หมดอายุ (${expiredCoupon.length})`}
          selected={selectedTab === "expired"}
          onSelect={() => setSelectedTab("expired")}
        />
      </div>

      {displayCoupons.length === 0 && (
        <div className="py-16 flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${clientConfig.ui.text_gray_color}`,
              opacity: 0.7,
            }}
          >
            <Ticket size={30} color={clientConfig.ui.text_white_color} />
          </div>

          <div>
            <div
              className="text-lg font-semibold"
              style={{ color: clientConfig.ui.text_color }}
            >
              ยังไม่มีคูปอง
            </div>

            <div
              className="text-sm text-gray-500 mt-1"
              style={{ color: clientConfig.ui.text_gray_color }}
            >
              เมื่อคุณได้รับคูปอง รายการจะแสดงที่นี่
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {displayCoupons.map((coupon, index) => {
          const canUse =
            !coupon.is_used &&
            (coupon.state === "redeemed" ||
              !coupon.expiration_date ||
              new Date(coupon.expiration_date.replace(" ", "T")) > new Date());
          const cp: CouponType = {
            id: coupon.id,
            name: coupon.name,
            image_url: coupon.coupon.image_url,
            value: Number(coupon.value),
            start_time: coupon.acquired_date,
            end_time: coupon.expiration_date || coupon.acquired_date,
            code_expiry_interval: 10,
            redeemed_count: 0,
            term_and_condition: coupon.coupon.term_and_condition,
            currency: coupon.currency,
          };

          return (
            <CouponCard
              key={index}
              coupon={cp}
              canUse={canUse}
              onClick={() => {
                router.push(`/${clientConfig.slug}/coupon/my/${coupon.id}`);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
