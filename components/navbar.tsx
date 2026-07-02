"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket } from "tabler-icons-react";
import {
  IconCamera,
  IconClock,
  IconScan,
  IconSettings,
  IconShoppingBag,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useApp } from "./providers/app-provider";
import { isErrorResponse } from "@/types/request";

const navbars = [
  {
    icon: IconShoppingBag,
    href: "/",
    title: "หน้าหลัก",
  },
  {
    icon: Ticket,
    href: "/coupon/my",
    title: "คูปอง",
  },
  {
    icon: IconScan,
    href: "/scan",
    title: "สแกน QR",
    isCenter: true,
  },
  {
    icon: IconClock,
    href: "/history",
    title: "ประวัติ",
  },
  {
    icon: IconSettings,
    href: "/member",
    title: "ตั้งค่า",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    clientConfig,
    appUserProfile,
    isShowNavbar,
    userProfile,
    backendClient,
    closeScanner,
    openReceipt,
    openAlert,
  } = useApp();

  const getHref = (href: string) =>
    href === "/" ? `/${clientConfig.slug}` : `/${clientConfig.slug}${href}`;

  if (
    typeof appUserProfile === "undefined" ||
    appUserProfile?.force_verify_phone ||
    appUserProfile?.force_verify_email
  ) {
    return;
  }

  if (!isShowNavbar) {
    return;
  }

  const handleQRCode = async (qrText: string) => {
    try {
      closeScanner();

      const isUrl = /^https?:\/\/.+/i.test(qrText);

      if (isUrl) {
        router.push(qrText);
        return;
      }

      await openAlert({
        title: "QR Code",
        message: qrText,
      });
    } catch (err) {
      console.error(err);
      await openAlert({
        title: "เกิดข้อผิดพลาด",
        message: "เกิดข้อผิดพลาด",
      });
    }
  };
  return (
    <>
      <div
        style={{ height: 110, paddingBottom: "env(safe-area-inset-bottom)" }}
      ></div>
      <div
        className="navbar grid grid-cols-[1fr_1fr_72px_1fr_1fr] justify-around items-center pt-2 px-3.5 pb-7.5 shadow-md bg-[linear-gradient(180deg,transparent,var(--bg)_30%)]"
        style={{
          background: `linear-gradient(180deg, transparent, ${clientConfig.ui.background_color} 30%)`,
        }}
      >
        {navbars.map((navbar, index) => {
          const targetPath = getHref(navbar.href);
          const isActive = pathname === targetPath;
          const Icon = navbar.icon;

          if (navbar.isCenter) {
            return (
              <div key={index} className="flex justify-center items-center">
                <div
                  className="w-15 h-15 rounded-full flex items-center justify-center text-white -translate-y-1"
                  style={{
                    background: `linear-gradient(135deg, ${clientConfig.ui.primary_color}, ${clientConfig.ui.secondary_color})`,
                    boxShadow: `0 6px 24px -4px color-mix(in oklch, ${clientConfig.ui.primary_color} 70%, transparent), 0 0 0 6px ${clientConfig.ui.background_color}`,
                  }}
                  onClick={() => {
                    // openScanner({
                    //   onResult: handleQRCode,
                    //   primaryColor: clientConfig.ui.primary_color,
                    //   secondaryColor: clientConfig.ui.secondary_color,
                    //   textWhiteColor: clientConfig.ui.text_white_color,
                    // })

                    openReceipt({
                      primaryColor: clientConfig.ui.primary_color,
                      textWhiteColor: clientConfig.ui.text_white_color,
                      textGrayColor: clientConfig.ui.text_gray_color,
                      backgroundWhiteColor:
                        clientConfig.ui.background_white_color,
                      onSubmit: async ({
                        receiptNumber,
                        amount,
                        receiptImage,
                      }) => {
                        if (!userProfile?.userId) {
                          return;
                        }

                        const response = await backendClient.submitReceipt(
                          clientConfig.slug,
                          userProfile.userId,
                          receiptNumber,
                          amount,
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
                  {/* <Icon size={26} /> */}
                  <IconCamera size={26} />
                </div>
              </div>
            );
          }

          if (isActive) {
            return (
              <div
                className={
                  "flex flex-col justify-center items-center gap-1 isActive pt-2 px-1 pb-1"
                }
                style={{ color: clientConfig.ui.primary_color }}
                key={index}
              >
                <Icon size={24} />
                <span className="text-[10px] font-medium">{navbar.title}</span>
              </div>
            );
          }

          return (
            <Link
              href={targetPath}
              className="flex flex-col justify-center items-center gap-1 pt-2 px-1 pb-1"
              style={{ color: clientConfig.ui.text_gray_color }}
              key={index}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{navbar.title}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
