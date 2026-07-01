"use client";

/* eslint-disable @next/next/no-img-element */

import { useApp } from "./providers/app-provider";

export default function HeaderSection() {
  const { userProfile, clientConfig } = useApp();

  return (
    <div>
      <div className="relative h-80 -mb-45 pointer-events-none">
        <img
          src={clientConfig?.ui?.banner ?? ""}
          alt="banner"
          className="absolute inset-0 w-full h-full object-cover block"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg,rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, ${clientConfig.ui.background_color} 100%)`,
          }}
        ></div>
      </div>
      <header className="relative z-2 pt-16 px-4.5 pb-4.5 flex items-center justify-between">
        {/* <button
          className="w-9.5 h-9.5 rounded-xl flex items-center justify-center border"
          style={{
            background: clientConfig.ui.primary_color,
            borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
          }}
        >
          <IconBell className="text-white w-5 h-5" />
        </button> */}
      </header>
      <div className="relative z-2 flex items-center gap-4 px-4.5 pb-5.5">
        {!!userProfile?.pictureUrl ? (
          <img
            src={userProfile.pictureUrl}
            alt="profile"
            className="h-12.5 w-12.5 rounded-full"
            style={{
              border: `1px solid ${clientConfig.ui.primary_color}`,
            }}
          />
        ) : (
          <img
            src={clientConfig.logo_url}
            alt="profile-fallback"
            className="h-12.5 w-12.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <div
            className="text-md font-semibold tracking-[-0.17px]"
            style={{
              color: clientConfig.ui.text_color,
            }}
          >
            {clientConfig.ui.welcome_title || "ยินดีต้อนรับ"}
          </div>

          <div
            className="tracking-[0.02em] font-medium"
            style={{
              color: clientConfig.ui.text_gray_color,
            }}
          >
            {userProfile?.displayName}
          </div>
        </div>
        <div>
          {!!clientConfig.logo_url && (
            <img
              src={clientConfig.logo_url}
              alt="logo"
              className="h-9.5 w-auto rounded-xl bg-white"
              style={{
                boxShadow: `0 0 0 0.5px rgba(255,255,255,0.06), 0 4px 18px -4px color-mix(in oklch, ${clientConfig.ui.primary_color} 60%, transparent)`,
              }}
            />
          )}
        </div>
        {/* <button
          className="w-11 h-11 rounded-xl flex items-center justify-center border"
          style={{
            background: `linear-gradient(135deg, ${clientConfig.ui.primary_color}, ${clientConfig.ui.secondary_color})`,
            boxShadow: `0 6px 20px -4px color-mix(in oklch, ${clientConfig.ui.primary_color} 70%, transparent)`,
            borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
          }}
          onClick={() => {
            openScanner({
              onResult: handleQRCode,
              primaryColor: clientConfig.ui.primary_color,
              secondaryColor: clientConfig.ui.secondary_color,
              textWhiteColor: clientConfig.ui.text_white_color,
            });
          }}
        >
          <IconQrcode className="text-white w-5.5 h-5.5" />
        </button> */}
        {/* <button
          className="w-11 h-11 rounded-xl flex items-center justify-center border"
          style={{
            background: `linear-gradient(135deg, ${clientConfig.ui.primary_color}, ${clientConfig.ui.secondary_color})`,
            boxShadow: `0 6px 20px -4px color-mix(in oklch, ${clientConfig.ui.primary_color} 70%, transparent)`,
            borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
          }}
          onClick={() => {
            openReceipt({
              primaryColor: clientConfig.ui.primary_color,
              textWhiteColor: clientConfig.ui.text_white_color,
              textGrayColor: clientConfig.ui.text_gray_color,
              backgroundWhiteColor: clientConfig.ui.background_white_color,
              onSubmit: async ({ receiptNumber, receiptImage }) => {
                if (!userProfile?.userId) {
                  return;
                }

                const response = await backendClient.submitReceipt(
                  clientConfig.slug,
                  userProfile.userId,
                  receiptNumber,
                  receiptImage,
                );

                if (isErrorResponse(response)) {
                  return {
                    ok: false,
                    message: response.message || "ส่งใบเสร็จไม่สำเร็จ",
                  };
                }

                return { ok: true };
              },
            });
          }}
        >
          <IconCamera className="text-white w-5.5 h-5.5" />
        </button> */}
      </div>
    </div>
  );
}
