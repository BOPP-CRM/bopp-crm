"use client";

import { useApp } from "@/components/providers/app-provider";
import { Sk } from "@/components/skeleton";
import { isErrorResponse, Warranty } from "@/types/request";
import { formatDate } from "@/util/format-date";
import {
  IconChevronLeft,
  IconChevronRight,
  IconShieldOff,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const { clientConfig, backendClient, setIsShowNavbar } = useApp();
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsShowNavbar(false);
    return () => {
      setIsShowNavbar(true);
    };
  }, [setIsShowNavbar]);

  useEffect(() => {
    backendClient.listUserWarranties(clientConfig.slug).then((res) => {
      if (!isErrorResponse(res)) setWarranties(res);
      setIsLoading(false);
    });
  }, [backendClient, clientConfig.slug]);

  const line = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 22%, transparent)`;
  const surface = clientConfig.ui.surface_color;
  const border = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`;

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{ color: clientConfig.ui.text_color }}
    >
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
          ประวัติการลงทะเบียนรับประกัน
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Sk key={i} className="h-24 rounded-2xl" bg={surface} />
          ))}
        </div>
      ) : warranties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: line }}
          >
            <IconShieldOff size={30} color={clientConfig.ui.text_gray_color} />
          </div>
          <div className="text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: clientConfig.ui.text_color }}
            >
              ยังไม่มีการลงทะเบียน
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: clientConfig.ui.text_gray_color }}
            >
              เมื่อคุณลงทะเบียนสินค้า รายการจะแสดงที่นี่
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {warranties.map((w) => (
            <button
              key={w.id}
              type="button"
              className="w-full text-left rounded-2xl border p-4 flex items-center gap-3"
              style={{ backgroundColor: surface, borderColor: border }}
              onClick={() =>
                router.push(`/${clientConfig.slug}/warranty/history/${w.id}`)
              }
            >
              {w.receipt_image_url ? (
                <img
                  src={w.receipt_image_url}
                  alt={w.receipt_number}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  style={{
                    backgroundColor: clientConfig.ui.background_white_color,
                  }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl shrink-0"
                  style={{ backgroundColor: line }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium truncate"
                  style={{ color: clientConfig.ui.text_color }}
                >
                  {w.product.name}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: clientConfig.ui.text_gray_color }}
                >
                  S/N: {w.serial_number}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: clientConfig.ui.text_gray_color }}
                >
                  {formatDate(w.submitted_date)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between h-14">
                <p
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${w.status.color}22`,
                    color: w.status.color,
                  }}
                >
                  {w.status.label}
                </p>
                <IconChevronRight
                  size={16}
                  color={clientConfig.ui.text_gray_color}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
