"use client";
import { useEffect, useState, useCallback } from "react";
import { useApp } from "./providers/app-provider";
import Link from "next/link";
import { Award, Scan } from "tabler-icons-react";
import { GetUserPointRespont, isErrorResponse } from "@/types/request";

export default function Profile() {
  const {
    userProfile,
    clientConfig,
    backendClient,
    setUserPoint,
    openScanner,
    closeScanner,
    openAlert,
  } = useApp();

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

  const fetchData = useCallback(async () => {
    if (!clientConfig.slug || !userProfile?.userId) return;

    const points = await backendClient.getUserPoint(
      clientConfig.slug,
      userProfile.userId,
    );

    if (isErrorResponse(points)) {
      setUserPoint([]);
      return;
    }
    setUserPoint(points);

    const mainPoint = points.find((point) => point.currency.is_default);
    if (mainPoint) setMainPoint(mainPoint);
  }, [clientConfig.slug, userProfile?.userId, backendClient, setUserPoint]);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleQRCode = async (qrText: string) => {
    try {
      console.log("QR:", qrText);
      closeScanner();

      const isUrl = /^https?:\/\/.+/i.test(qrText);

      if (isUrl) {
        window.location.href = qrText;
        return;
      }

      await openAlert({
        title: "QR Code",
        message: qrText,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      await openAlert({
        title: "เกิดข้อผิดพลาด",
        message: "เกิดข้อผิดพลาด",
      });
    }
  };

  return (
    <div className="shrink-0">
      {/* HEADER */}
      <div
        className="flex justify-between items-center p-2 px-5 rounded-t-md shadow-md"
        style={{ backgroundColor: clientConfig.ui.background_white_color }}
      >
        <Link href={`/${clientConfig.slug}/member`} className="flex gap-4">
          {!!userProfile?.pictureUrl ? (
            <img
              src={userProfile.pictureUrl}
              className="h-14 w-14 rounded-full border-2"
            />
          ) : (
            <img src={clientConfig.logo_url} className="h-10 w-10" />
          )}

          <div>
            <div
              className="text-[18px]"
              style={{
                color: clientConfig.ui.primary_color,
              }}
            >
              {clientConfig.ui.welcome_title || "ยินดีต้อนรับ"}
            </div>

            <div className="text-2xl">{userProfile?.displayName}</div>
          </div>
        </Link>

        {!!clientConfig.logo_url && (
          <img src={clientConfig.logo_url} className="h-20 w-20" />
        )}
      </div>
      <div
        className="flex shadow-md rounded-b-md px-5 py-4 gap-3 items-center justify-between"
        style={{
          backgroundColor: clientConfig.ui.primary_color,
          color: clientConfig.ui.text_white_color,
        }}
      >
        <div className="flex items-center gap-2">
          <Award />
          <span>
            <span className="text-2xl">
              {mainPoint.balance.toLocaleString()}{" "}
            </span>
            <span className="text-xl">
              {mainPoint.currency.name.toLocaleUpperCase()}
            </span>
          </span>
        </div>
        <div
          className="cursor-pointer"
          onClick={() =>
            openScanner({
              onResult: handleQRCode,
              onClose: async () => {
                await fetchData();
              },
              primaryColor: clientConfig.ui.primary_color,
              secondaryColor: clientConfig.ui.secondary_color,
              textWhiteColor: clientConfig.ui.text_white_color,
            })
          }
        >
          <Scan />
        </div>
      </div>
    </div>
  );
}
