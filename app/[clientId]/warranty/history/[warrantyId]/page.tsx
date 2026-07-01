"use client";

import { useApp } from "@/components/providers/app-provider";
import { Sk } from "@/components/skeleton";
import { isErrorResponse, Warranty } from "@/types/request";
import { formatDate } from "@/util/format-date";
import { IconChevronLeft } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function Row({
  label,
  value,
  borderColor,
  labelColor,
  valueColor,
}: {
  label: string;
  value: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <div
      className="px-5 py-4 flex justify-between items-center border-t-[0.5px] text-[13px]"
      style={{ borderColor }}
    >
      <p style={{ color: labelColor }}>{label}</p>
      <p style={{ color: valueColor }}>{value || "-"}</p>
    </div>
  );
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { clientConfig, backendClient, setIsShowNavbar } = useApp();
  const [warranty, setWarranty] = useState<Warranty | null>(null);

  const warrantyId = Array.isArray(params.warrantyId)
    ? params.warrantyId[0]
    : params.warrantyId;

  useEffect(() => {
    Promise.resolve().then(() => setIsShowNavbar(false));
    return () => setIsShowNavbar(true);
  }, [setIsShowNavbar]);

  useEffect(() => {
    if (!warrantyId) return;
    backendClient.getUserWarrantyById(clientConfig.slug, warrantyId).then((res) => {
      if (!isErrorResponse(res)) setWarranty(res);
    });
  }, [backendClient, clientConfig.slug, warrantyId]);

  const surface = clientConfig.ui.surface_color;
  const border = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`;
  const line = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 22%, transparent)`;

  if (!warranty) {
    return (
      <div
        className="min-h-screen px-5 pt-8 pb-20"
        style={{ backgroundColor: clientConfig.ui.background_color }}
      >
        <Sk className="h-10 w-10 rounded-full" bg={surface} />
        <Sk className="mt-6 h-48 w-full rounded-2xl" bg={surface} />
        <Sk className="mt-5 h-6 w-1/2 rounded-xl" bg={line} />
        <div className="mt-4 rounded-3xl border-[0.5px]" style={{ background: surface, borderColor: border }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 border-t-[0.5px] flex justify-between" style={{ borderColor: border }}>
              <Sk className="h-4 w-20" bg={line} />
              <Sk className="h-4 w-28" bg={line} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: clientConfig.ui.background_color, color: clientConfig.ui.text_color }}
    >
      <div className="px-5 pt-8 pb-4 flex items-center gap-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push(`/${clientConfig.slug}/warranty/history`)}
          className="rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm shrink-0"
        >
          <IconChevronLeft size={24} />
        </button>
        <p className="font-bodoni text-xl font-medium" style={{ color: clientConfig.ui.text_color }}>
          รายละเอียดการรับประกัน
        </p>
      </div>

      <div className="px-5">
        {warranty.receipt_image_url ? (
          <img
            src={warranty.receipt_image_url}
            alt="receipt"
            className="w-full max-h-56 object-contain rounded-2xl"
            style={{ backgroundColor: clientConfig.ui.background_white_color }}
          />
        ) : (
          <div
            className="w-full h-40 rounded-2xl"
            style={{ backgroundColor: line }}
          />
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-2xl font-medium font-bodoni" style={{ color: clientConfig.ui.text_color }}>
            {warranty.product.name}
          </p>
          <span
            className="text-xs font-medium px-3 py-1 rounded-full shrink-0 ml-3"
            style={{ backgroundColor: `${warranty.status.color}22`, color: warranty.status.color }}
          >
            {warranty.status.label}
          </span>
        </div>

        <div
          className="mt-5 rounded-3xl border-[0.5px] overflow-hidden"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <div className="px-5 py-4 flex justify-between items-center text-[13px]">
            <p style={{ color: clientConfig.ui.text_gray_color }}>Serial Number</p>
            <p style={{ color: clientConfig.ui.text_color }}>{warranty.serial_number || "-"}</p>
          </div>
          <Row
            label="หมายเลขใบเสร็จ"
            value={warranty.receipt_number}
            borderColor={border}
            labelColor={clientConfig.ui.text_gray_color}
            valueColor={clientConfig.ui.text_color}
          />
          <Row
            label="ช่องทางการซื้อ"
            value={warranty.contributor.name}
            borderColor={border}
            labelColor={clientConfig.ui.text_gray_color}
            valueColor={clientConfig.ui.text_color}
          />
          <Row
            label="วันที่ซื้อสินค้า"
            value={formatDate(warranty.purchase_date)}
            borderColor={border}
            labelColor={clientConfig.ui.text_gray_color}
            valueColor={clientConfig.ui.text_color}
          />
          <Row
            label="วันที่ลงทะเบียน"
            value={formatDate(warranty.submitted_date)}
            borderColor={border}
            labelColor={clientConfig.ui.text_gray_color}
            valueColor={clientConfig.ui.text_color}
          />
        </div>
      </div>
    </div>
  );
}
