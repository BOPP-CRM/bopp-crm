import {
  IconCamera,
  IconCurrencyDollar,
  IconHistoryToggle,
  IconReceipt,
  IconShieldCheck,
  IconTicket,
} from "@tabler/icons-react";
import { useApp } from "./providers/app-provider";
import { isErrorResponse } from "@/types/request";
import { useRouter } from "next/navigation";

export default function MenuSection() {
  const { clientConfig, userProfile, backendClient, openReceipt } = useApp();
  const router = useRouter();

  return (
    <div
      className="mx-4.5 my-6 flex gap-8 overflow-x-auto scroll-smooth no-scrollbar"
      style={{
        color: clientConfig.ui.text_white_color,
      }}
    >
      {clientConfig.warranty.enabled && (
        <>
          <div>
            <button
              className="rounded-2xl w-15 h-15 flex justify-center items-center"
              style={{
                background: clientConfig.ui.secondary_color,
              }}
              onClick={() => {
                router.push(`/${clientConfig.slug}/warranty`);
              }}
            >
              <IconShieldCheck size={30} />
            </button>
            <p className="w-15 text-xs mt-1.5 text-center line-clamp-2">
              ลงทะเบียนรับประกัน
            </p>
          </div>
          <div>
            <button
              className="rounded-2xl w-15 h-15 flex justify-center items-center"
              style={{
                background: clientConfig.ui.secondary_color,
              }}
              onClick={() => {
                router.push(`/${clientConfig.slug}/warranty/history`);
              }}
            >
              <IconHistoryToggle size={30} />
            </button>
            <p className="w-15 text-xs mt-1.5 text-center line-clamp-2">
              ประวัติการรับประกัน
            </p>
          </div>
        </>
      )}

      <div>
        <button
          className="rounded-2xl w-15 h-15 flex justify-center items-center"
          style={{
            background: clientConfig.ui.secondary_color,
          }}
          onClick={() => {
            router.push(`/${clientConfig.slug}/member-receipt`);
          }}
        >
          <IconReceipt size={30} />
        </button>
        <p className="w-15 text-xs mt-1.5 text-center line-clamp-2">ใบเสร็จ</p>
      </div>
      <div>
        <button
          className="rounded-2xl w-15 h-15 flex justify-center items-center"
          style={{
            background: clientConfig.ui.secondary_color,
          }}
          onClick={() => {
            openReceipt({
              primaryColor: clientConfig.ui.primary_color,
              textWhiteColor: clientConfig.ui.text_white_color,
              textGrayColor: clientConfig.ui.text_gray_color,
              backgroundWhiteColor: clientConfig.ui.background_white_color,
              onSubmit: async ({ receiptNumber, amount, receiptImage }) => {
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
          <IconCamera size={30} />
        </button>
        <p className="w-15 text-xs mt-1.5 text-center line-clamp-2">สะสมแต้ม</p>
      </div>
      <div>
        <button
          className="rounded-2xl w-15 h-15 flex justify-center items-center"
          style={{
            background: clientConfig.ui.secondary_color,
          }}
          onClick={() => {
            router.push(`/${clientConfig.slug}/coupon/my`);
          }}
        >
          <IconTicket size={30} />
        </button>
        <p className="w-15 text-xs mt-1.5 text-center line-clamp-2">
          คูปองของฉัน
        </p>
      </div>
      <div>
        <button
          className="rounded-2xl w-15 h-15 flex justify-center items-center"
          style={{
            background: clientConfig.ui.secondary_color,
          }}
          onClick={() => {
            router.push(`/${clientConfig.slug}/history`);
          }}
        >
          <IconCurrencyDollar size={30} />
        </button>
        <p className="w-15 text-xs mt-1.5 text-center line-clamp-2">
          ประวัติคะแนน
        </p>
      </div>
    </div>
  );
}
