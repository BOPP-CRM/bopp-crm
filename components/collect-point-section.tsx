"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./providers/app-provider";
import Button from "./button";
import Input from "./input";
import { isErrorResponse, type OmisellPlatform } from "@/types/request";
import { IconCamera, IconChevronDown } from "@tabler/icons-react";

type OnlineChannel = {
  id: OmisellPlatform;
  name: string;
  logo: string;
};

const ONLINE_CHANNELS: OnlineChannel[] = [
  {
    id: "shopee",
    name: "Shopee",
    logo: "/shopee.png",
  },
  {
    id: "lazada",
    name: "Lazada",
    logo: "/lazada.png",
  },
  {
    id: "tiktok",
    name: "TikTok Shop",
    logo: "/tiktok.png",
  },
];

type CollectTab = "online" | "distributor";

export default function CollectPointSection() {
  const { backendClient, clientConfig, userProfile, openReceipt, openAlert } =
    useApp();

  const lazada_enabled = clientConfig.integrations.lazada.enabled;
  const omisell_enabled = clientConfig.integrations.omisell.enabled;
  const hasOnlineIntegration = lazada_enabled || omisell_enabled;

  const [activeTab, setActiveTab] = useState<CollectTab>(
    hasOnlineIntegration ? "online" : "distributor",
  );
  const [channelId, setChannelId] = useState(ONLINE_CHANNELS[0].id);
  const [orderNumber, setOrderNumber] = useState("");
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const channelDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedChannel = useMemo(
    () => ONLINE_CHANNELS.find((c) => c.id === channelId) ?? ONLINE_CHANNELS[0],
    [channelId],
  );

  const canSubmit = orderNumber.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!channelDropdownRef.current) return;
      if (!channelDropdownRef.current.contains(event.target as Node)) {
        setIsChannelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleChannelSelect = (channel: OnlineChannel) => {
    setChannelId(channel.id);
    setIsChannelOpen(false);
  };

  const handleSubmitOmisellOrder = async () => {
    if (!canSubmit) return;
    if (!userProfile?.userId) return;

    try {
      setIsSubmitting(true);
      const response = await backendClient.submitOmisellClaim(
        clientConfig.slug,
        userProfile.userId,
        {
          platform: selectedChannel.id,
          orderNumber: orderNumber.trim(),
        },
      );

      if (isErrorResponse(response)) {
        await openAlert({
          title: "สะสมคะแนนไม่สำเร็จ",
          message: response.message || "ไม่สามารถสะสมคะแนนได้",
        });
        return;
      }

      const rewardPoint = response.reward_point;
      const currencyName = rewardPoint?.currency?.name || "คะแนน";
      await openAlert({
        title: "สะสมคะแนนสำเร็จ",
        message: rewardPoint?.value
          ? `คุณได้รับ ${rewardPoint.value} ${currencyName}`
          : "คุณได้รับคะแนนเรียบร้อยแล้ว",
      });
      setOrderNumber("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitLazadaOrder = async () => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      const response = await backendClient.submitLazadaClaim(
        clientConfig.slug,
        orderNumber.trim(),
      );

      if (isErrorResponse(response)) {
        await openAlert({
          title: "สะสมคะแนนไม่สำเร็จ",
          message: response.message || "ไม่สามารถสะสมคะแนนได้",
        });
        return;
      }

      const rewardValue = response.claim.reward_value;
      await openAlert({
        title: "สะสมคะแนนสำเร็จ",
        message:
          rewardValue > 0
            ? `คุณได้รับ ${rewardValue} คะแนน`
            : "คุณได้รับคะแนนเรียบร้อยแล้ว",
      });
      setOrderNumber("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const receiptContent = (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <p className="text-sm" style={{ color: clientConfig.ui.text_gray_color }}>
        ถ่ายรูปใบเสร็จหน้าร้านค้าตัวแทนจำหน่ายเพื่อสะสมคะแนน
      </p>
      <Button
        text="ถ่ายใบเสร็จ"
        icon={<IconCamera size={18} />}
        onClick={() => {
          openReceipt({
            primaryColor: clientConfig.ui.primary_color,
            textWhiteColor: clientConfig.ui.text_white_color,
            textGrayColor: clientConfig.ui.text_gray_color,
            backgroundWhiteColor: clientConfig.ui.background_white_color,
            onSubmit: async ({ receiptNumber, amount, receiptImage }) => {
              if (!userProfile?.userId) return;

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
      />
    </div>
  );

  return (
    <section className="mx-4.5 mb-5.5">
      <div className="mb-4 flex items-center justify-between px-0.5">
        <p
          className="text-xl leading-none font-medium font-bodoni"
          style={{ color: clientConfig.ui.text_color }}
        >
          สะสมแต้ม
        </p>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{
          background: clientConfig.ui.surface_color,
          border: `0.5px solid rgba(255,255,255,0.08)`,
        }}
      >
        {hasOnlineIntegration && (
          <div className="flex gap-2 mb-4">
            {(
              [
                { key: "online", label: "ออนไลน์" },
                { key: "distributor", label: "ร้านค้าตัวแทนจำหน่าย" },
              ] as { key: CollectTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                className="flex-1 h-10 rounded-full text-sm font-semibold transition-colors"
                style={{
                  background:
                    activeTab === tab.key
                      ? clientConfig.ui.button_color
                      : "transparent",
                  color:
                    activeTab === tab.key
                      ? clientConfig.ui.button_text_color
                      : clientConfig.ui.text_gray_color,
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {!hasOnlineIntegration ? (
          receiptContent
        ) : activeTab === "online" ? (
          lazada_enabled ? (
            <div className="flex flex-col gap-3">
              <div
                className="h-14 w-full rounded-[14px] border px-3 flex items-center"
                style={{
                  borderColor: clientConfig.ui.text_gray_color + "40",
                  color: clientConfig.ui.text_color,
                }}
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/lazada.png"
                    alt="Lazada"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-cover rounded-md"
                  />
                  <span className="text-sm font-medium">Lazada</span>
                </div>
              </div>

              <Input
                placeholder="เลขที่คำสั่งซื้อ Lazada"
                value={orderNumber}
                onChange={(value) =>
                  setOrderNumber(String(value).toUpperCase())
                }
              />

              <Button
                text="สะสมคะแนน"
                disabled={!canSubmit}
                onClick={handleSubmitLazadaOrder}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative" ref={channelDropdownRef}>
                <button
                  type="button"
                  className="h-14 w-full rounded-[14px] border px-3 text-left"
                  style={{
                    borderColor: clientConfig.ui.text_gray_color + "40",
                    color: clientConfig.ui.text_color,
                    background: "transparent",
                  }}
                  onClick={() => setIsChannelOpen((prev) => !prev)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src={selectedChannel.logo}
                        alt={selectedChannel.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-cover rounded-md"
                      />
                      <span className="text-sm font-medium">
                        {selectedChannel.name}
                      </span>
                    </div>
                    <IconChevronDown
                      size={18}
                      style={{ color: clientConfig.ui.text_gray_color }}
                    />
                  </div>
                </button>

                {isChannelOpen && (
                  <button
                    type="button"
                    className="fixed inset-0 z-30"
                    aria-label="close-platform-dropdown"
                    onClick={() => setIsChannelOpen(false)}
                  />
                )}

                {isChannelOpen && (
                  <div
                    className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border"
                    style={{
                      background: clientConfig.ui.surface_color,
                      borderColor: clientConfig.ui.text_gray_color + "20",
                    }}
                  >
                    {ONLINE_CHANNELS.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
                        style={{
                          color: clientConfig.ui.text_color,
                          borderColor: clientConfig.ui.text_gray_color + "20",
                          background:
                            channelId === channel.id
                              ? clientConfig.ui.primary_color + "1A"
                              : "transparent",
                        }}
                        onClick={() => handleChannelSelect(channel)}
                      >
                        <Image
                          src={channel.logo}
                          alt={channel.name}
                          width={28}
                          height={28}
                          className="h-7 w-7 object-cover rounded-md"
                        />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Input
                placeholder="เลขที่ใบเสร็จ/ คำสั่งซื้อ"
                value={orderNumber}
                onChange={(value) =>
                  setOrderNumber(String(value).toUpperCase())
                }
              />

              <Button
                text="สะสมคะแนน"
                disabled={!canSubmit}
                onClick={handleSubmitOmisellOrder}
              />
            </div>
          )
        ) : (
          receiptContent
        )}
      </div>
    </section>
  );
}
