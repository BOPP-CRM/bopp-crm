import { GetUserPointRespont, isErrorResponse } from "@/types/request";
import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "./providers/app-provider";
import QRCode from "react-qr-code";
import { IconQrcode, IconRefresh, IconX } from "@tabler/icons-react";

export default function PointCard() {
  const {
    userProfile,
    clientConfig,
    backendClient,
    setUserPoint,
    appUserProfile,
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
  const [isOpenQr, setIsOpenQr] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  }, [clientConfig.slug, userProfile, backendClient, setUserPoint]);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleQRCode = async (qrText: string) => {
    try {
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
    <section
      className="relative mx-4.5 mb-5.5 rounded-[22px] pt-5.5 px-5.5 pb-5 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${clientConfig.ui.primary_color}, ${clientConfig.ui.secondary_color})`,
        boxShadow: `10px 10px 40px -10px color-mix(in oklch, ${clientConfig.ui.secondary_color} 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.18)`,
      }}
    >
      <div
        className="absolute w-[70%] h-[140%] top-[-40%] right-[-20%] blur-lg"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.25), transparent 60%)",
        }}
      ></div>
      <div className="flex justify-between items-center">
        <div
          className="flex gap-1.5"
          style={{ color: clientConfig.ui.text_white_color }}
        >
          <p className="text-sm font-medium">พ้อยคงเหลือ</p>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await fetchData();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
          >
            <IconRefresh
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
        </div>

        <div
          className="flex items-center gap-1.25 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            color: appUserProfile?.tier.color,
            border: `1px solid ${appUserProfile?.tier.color}`,
          }}
        >
          <div
            className="h-1.25 w-1.25 rounded-full"
            style={{
              backgroundColor: appUserProfile?.tier.color,
            }}
          ></div>
          {appUserProfile?.tier.name}
        </div>
      </div>
      <div className="flex justify-between items-end mt-1.5">
        <div className="text-white mt-1">
          <p className="text-[54px] font-semibold font-bodoni">
            {mainPoint.balance.toLocaleString()}{" "}
          </p>
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase -mt-4">
            {mainPoint.currency.name}
          </p>
        </div>
        <div className="z-10">
          <button
            className="p-0.5 rounded-lg"
            style={{ backgroundColor: clientConfig.ui.text_white_color }}
            onClick={() => setIsOpenQr(true)}
          >
            <IconQrcode
              size={36}
              style={{ color: clientConfig.ui.secondary_color }}
            />
          </button>
        </div>
      </div>

      {/* <div className="pt-3 flex justify-between border-t-[0.5px] border-[rgba(255,255,255,0.18)] text-white"> */}
      {/* <p className="text-[10.5px] font-mono">Lifetime · xxxx</p> */}
      {/* <button
          className="h-7 font-mono cursor-pointer flex items-center gap-2.5 border-[0.5px] rounded-full px-3 py-1 bg-[rgba(255,255,255,0.18)] z-1"
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
          <IconScan size={16} />{" "}
          <p className="text-xs font-semibold">เก็บแต้ม</p>
        </button> */}
      {/* </div> */}
      {isOpenQr && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpenQr(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl w-screen md:w-125 mx-auto flex flex-col"
            style={{ background: clientConfig.ui.surface_color }}
          >
            <div
              className="px-5 py-4 text-base font-medium border-b shrink-0 flex items-center justify-between"
              style={{
                color: clientConfig.ui.text_color,
                borderColor: clientConfig.ui.text_gray_color + "20",
              }}
            >
              <span>QR Code สมาชิก</span>
              <button
                onClick={() => setIsOpenQr(false)}
                className="text-2xl leading-none"
                style={{ color: clientConfig.ui.text_gray_color }}
              >
                <IconX size={24} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-20">
              <div
                className="p-4 rounded-2xl"
                style={{ background: clientConfig.ui.surface_color }}
              >
                <QRCode
                  value={userProfile?.userId || ""}
                  size={220}
                  bgColor={clientConfig.ui.surface_color}
                  fgColor={clientConfig.ui.text_color}
                  level="Q"
                />
              </div>
              <p
                className="text-sm font-mono tracking-widest"
                style={{ color: clientConfig.ui.text_gray_color }}
              >
                {userProfile?.userId}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
