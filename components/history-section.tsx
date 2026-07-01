import React, { useEffect, useState } from "react";
import { useApp } from "./providers/app-provider";
import {
  GetUserPointHistoryRespont,
  GetUserPointRespont,
  isErrorResponse,
} from "@/types/request";
import MenuCard from "./menu-card";
import ChipButton from "./chip-button";
import { Award } from "tabler-icons-react";
import { Sk } from "./skeleton";

export default function HistorySection() {
  const { clientConfig, userProfile, backendClient } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "earn" | "burn" | "tranfer" | "expire"
  >("all");

  const [pointHistories, setpointHistories] = useState<
    GetUserPointHistoryRespont[]
  >([]);

  const [mainPoint, setMainPoint] = useState<GetUserPointRespont>({
    currency: {
      id: 0,
      name: "Point",
      is_default: true,
    },
    balance: 0,
    burn: 0,
    earn: 0,
    transfer: 0,
  });

  useEffect(() => {
    const loadPoints = async () => {
      if (!clientConfig.slug || !userProfile?.userId) return;

      const points = await backendClient.getUserPoint(
        clientConfig.slug,
        userProfile.userId,
      );

      if (isErrorResponse(points)) return;

      const main = points.find((p) => p.currency.is_default);
      if (main) setMainPoint(main);
    };

    Promise.resolve().then(loadPoints);
  }, [backendClient, clientConfig.slug, userProfile]);

  useEffect(() => {
    const loadHistories = async () => {
      if (!clientConfig.slug || !userProfile?.userId) {
        setIsLoading(false);
        return;
      }

      const histories = await backendClient.getUserPointHistory(
        clientConfig.slug,
        userProfile.userId,
      );

      if (isErrorResponse(histories)) {
        setpointHistories([]);
        setIsLoading(false);
        return;
      }

      setpointHistories(histories.filter((h) => h.currency.is_default));
      setIsLoading(false);
    };

    Promise.resolve().then(loadHistories);
  }, [backendClient, clientConfig.slug, userProfile]);

  const now = new Date();

  const isExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;

    const date = new Date(expirationDate.replace(" ", "T"));

    return !Number.isNaN(date.getTime()) && date < now;
  };

  const displayHistories =
    selectedTab === "all"
      ? pointHistories
      : selectedTab === "expire"
        ? pointHistories.filter((ph) => isExpired(ph.expiration_date))
        : pointHistories.filter((ph) => ph.type === selectedTab);

  if (isLoading) {
    const line = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 22%, transparent)`;
    const surface = clientConfig.ui.surface_color;
    const border = `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`;
    return (
      <div>
        <Sk className="h-9 w-56 mt-5 mb-6" bg={line} />
        <div
          className="rounded-[18px] border-[0.5px] p-4.5 mb-4.5 grid grid-cols-3"
          style={{
            background: surface,
            borderColor: clientConfig.ui.text_gray_color,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 py-1 ${i < 2 ? "border-r-[0.5px]" : ""}`}
              style={{ borderColor: border }}
            >
              <Sk className="h-2.5 w-6" bg={line} />
              <Sk className="h-7 w-14" bg={line} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4.5">
          {[72, 52, 52, 40, 60].map((w, i) => (
            <Sk
              key={i}
              className="h-8 rounded-full shrink-0"
              bg={line}
              style={{ width: w }}
            />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <Sk key={i} className="h-16 mb-3 rounded-2xl" bg={surface} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div
        className="text-2xl font-medium mt-5 mb-2 font-bodoni pb-4.5"
        style={{ color: clientConfig.ui.text_color }}
      >
        ประวัติการได้รับคะแนน
      </div>

      <div
        className="rounded-[18px] border-[0.5px] p-4.5 mb-4.5 grid grid-cols-3"
        style={{
          background: clientConfig.ui.surface_color,
          borderColor: clientConfig.ui.text_gray_color,
        }}
      >
        <div
          className="flex flex-col items-center justify-between border-r-[0.5px]"
          style={{
            borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
          }}
        >
          <p
            className="text-[10px]"
            style={{
              color: clientConfig.ui.text_gray_color,
              borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
            }}
          >
            รับ
          </p>
          <p
            className="text-xl font-medium font-bodoni"
            style={{
              color: clientConfig.ui.text_success_color,
            }}
          >
            {mainPoint.earn.toLocaleString()}
          </p>
        </div>
        <div
          className="flex flex-col items-center justify-between border-r-[0.5px]"
          style={{
            borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
          }}
        >
          <p
            className="text-[10px]"
            style={{
              color: clientConfig.ui.text_gray_color,
            }}
          >
            ใช้
          </p>
          <p
            className="text-xl font-medium font-bodoni"
            style={{
              color: clientConfig.ui.text_error_color,
            }}
          >
            {mainPoint.burn.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-center justify-between">
          <p
            className="text-[10px]"
            style={{
              color: clientConfig.ui.text_gray_color,
            }}
          >
            คงเหลือ
          </p>
          <div
            className="text-xl font-medium font-bodoni"
            style={{
              color: clientConfig.ui.text_color,
            }}
          >
            {mainPoint.balance.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4.5">
        <ChipButton
          label="ทั้งหมด"
          selected={selectedTab === "all"}
          onSelect={() => setSelectedTab("all")}
        />
        <ChipButton
          label="ได้มา"
          selected={selectedTab === "earn"}
          onSelect={() => setSelectedTab("earn")}
        />
        <ChipButton
          label="ใช้ไป"
          selected={selectedTab === "burn"}
          onSelect={() => setSelectedTab("burn")}
        />
        {/* <ChipButton
          label="โอน"
          selected={selectedTab === "tranfer"}
          onSelect={() => setSelectedTab("tranfer")}
        /> */}
        {/* <ChipButton
          label="หมดอายุ"
          selected={selectedTab === "expire"}
          onSelect={() => setSelectedTab("expire")}
        /> */}
      </div>

      {displayHistories.length > 0 &&
        displayHistories.map((pointHistory, index) => (
          <MenuCard key={index} pointHistory={pointHistory} />
        ))}

      {displayHistories.length === 0 && (
        <div className="py-8 flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${clientConfig.ui.text_gray_color}`,
              opacity: 0.7,
            }}
          >
            <Award size={30} color={clientConfig.ui.text_white_color} />
          </div>

          <div>
            <div
              className="text-lg font-semibold"
              style={{ color: clientConfig.ui.text_color }}
            >
              ยังไม่มีประวัติการได้รับคะแนน
            </div>

            <div
              className="text-sm text-gray-500 mt-1"
              style={{ color: clientConfig.ui.text_gray_color }}
            >
              เมื่อคุณได้รับคะแนน รายการจะแสดงที่นี่
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
