"use client";
import { useApp } from "@/components/providers/app-provider";
import { Sk } from "@/components/skeleton";
import { UserReceipt } from "@/types/request";
import { IconChevronLeft, IconReceipt, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const STATUS_LABEL: Record<UserReceipt["state"], string> = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
};

const STATUS_COLORS: Record<
  UserReceipt["state"],
  { bg: string; text: string }
> = {
  pending: { bg: "rgba(234,179,8,0.15)", text: "#ca8a04" },
  approved: { bg: "rgba(34,197,94,0.15)", text: "#16a34a" },
  rejected: { bg: "rgba(239,68,68,0.15)", text: "#dc2626" },
};

export default function MemberReceipt() {
  const {
    clientConfig,
    userProfile,
    backendClient,
    openAlert,
    setIsShowNavbar,
  } = useApp();
  const router = useRouter();

  const [receipts, setReceipts] = useState<UserReceipt[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    if (!userProfile || !clientConfig.slug) return;
    setIsLoading(true);
    const res = await backendClient.getUserReceipt(
      clientConfig.slug,
      userProfile.userId,
    );
    setIsLoading(false);

    if (res && !("error" in res)) {
      setReceipts(res);
    } else {
      openAlert({
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถดึงข้อมูลใบเสร็จได้",
      });
    }
  };

  useEffect(() => {
    Promise.resolve().then(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, clientConfig.slug]);

  useEffect(() => {
    setIsShowNavbar(false);
    return () => {
      setIsShowNavbar(true);
    };
  }, [setIsShowNavbar]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const line = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 22%, transparent)`;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-10">
      <div className="flex items-center pt-8 pb-6 gap-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push(`/${clientConfig.slug}`)}
          className="rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm shrink-0"
        >
          <IconChevronLeft size={24} />
        </button>
        <p
          className="font-bodoni text-xl font-medium"
          style={{ color: clientConfig.ui.text_color }}
        >
          ประวัติใบเสร็จ
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Sk
              key={i}
              className="h-24 rounded-2xl"
              bg={clientConfig.ui.surface_color}
            />
          ))}
        </div>
      )}

      {!isLoading && receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: line }}
          >
            <IconReceipt size={30} color={clientConfig.ui.text_gray_color} />
          </div>
          <div className="text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: clientConfig.ui.text_color }}
            >
              ยังไม่มีการสะสมคะแนนจากใบเสร็จ
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: clientConfig.ui.text_gray_color }}
            >
              ระบบจะทำการตรวจสอบและเพิ่มคะแนนให้คุณโดยอัตโนมัติ
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {receipts.map((receipt) => {
            const statusStyle = STATUS_COLORS[receipt.state];
            return (
              <div
                key={receipt.id}
                className="rounded-[18px] border-[0.5px] overflow-hidden"
                style={{
                  background: clientConfig.ui.surface_color,
                  borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
                }}
              >
                <div className="flex gap-4 p-4 items-start">
                  {receipt.receipt_image_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(receipt.receipt_image_url)}
                      className="shrink-0"
                    >
                      <img
                        src={receipt.receipt_image_url}
                        alt="receipt"
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    </button>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: clientConfig.ui.text_color }}
                      >
                        #{receipt.receipt_number}
                      </p>
                      <span
                        className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                        }}
                      >
                        {STATUS_LABEL[receipt.state]}
                      </span>
                    </div>
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: clientConfig.ui.text_color }}
                    >
                      {receipt.amount.toLocaleString()} บาท
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      {/* <p
                        className="text-base font-semibold font-bodoni"
                        style={{ color: clientConfig.ui.text_color }}
                      >
                        {receipt.amount === 0
                          ? "-"
                          : `฿${receipt.amount.toLocaleString()}`}
                      </p> */}
                      {receipt.reward_point && (
                        <p
                          className="text-sm font-semibold"
                          style={{ color: clientConfig.ui.primary_color }}
                        >
                          +{receipt.reward_point.value.toLocaleString()}{" "}
                          {receipt.reward_point.currency.name.toUpperCase()}
                        </p>
                      )}
                    </div>

                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: clientConfig.ui.text_gray_color }}
                    >
                      {formatDate(receipt.submitted_date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewUrl && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="relative w-full max-w-lg">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPreviewUrl(null)}
                className="absolute -top-4 -right-4 z-10 rounded-full p-2 shadow-lg"
                style={{ background: clientConfig.ui.surface_color }}
              >
                <IconX
                  size={20}
                  style={{ color: clientConfig.ui.text_color }}
                />
              </button>
              <img
                src={previewUrl}
                alt="receipt preview"
                className="w-full rounded-2xl object-contain max-h-[80vh]"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
