"use client";
import Input from "@/components/input";
import { useApp } from "@/components/providers/app-provider";
import { isErrorResponse } from "@/types/request";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Mail } from "tabler-icons-react";

export default function Page() {
  const {
    clientConfig,
    userProfile,
    backendClient,
    openAlert,
    setFullLoading,
    setAppUserProfile,
  } = useApp();

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const sendOtp = async () => {
    const cleanedEmail = email.trim().toLowerCase();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(cleanedEmail)) {
      openAlert({
        title: "เกิดข้อผิดพลาด",
        message: "กรุณากรอกอีเมลให้ถูกต้อง",
        onConfirm: () => {
          setOtp(["", "", "", "", "", ""]);
        },
      });
      return;
    }

    if (!userProfile?.userId) return;

    setFullLoading(true);
    const response = await backendClient.submitEmail(clientConfig.slug, {
      email: cleanedEmail,
      userId: userProfile.userId,
    });
    setFullLoading(false);
    if (isErrorResponse(response)) {
      openAlert({
        title: "เกิดข้อผิดพลาด",
        message: response.message,
        onConfirm: () => {
          setOtp(["", "", "", "", "", ""]);
        },
      });
      return;
    }

    setEmail(cleanedEmail);
    setRef(response.ref);
    setCountdown(30);
    setStep("otp");
  };

  const handleOtpChange = async (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);

    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      setFullLoading(true);
      const response = await backendClient.verifyEmail(clientConfig.slug, {
        otp: newOtp.join(""),
        ref: ref,
      });
      setFullLoading(false);
      if (isErrorResponse(response)) {
        openAlert({
          title: "เกิดข้อผิดพลาด",
          message: response.message,
        });
        return;
      }

      const appProfile = await backendClient.getUserInfo(clientConfig.slug);
      if (isErrorResponse(appProfile)) {
        router.push(`/${clientConfig.slug}`);
        return;
      }

      setAppUserProfile(appProfile);

      if (appProfile.force_verify_phone) {
        router.replace(`/${clientConfig.slug}/verify-phone`);
      } else if (appProfile.force_verify_email) {
        router.replace(`/${clientConfig.slug}/verify-email`);
      } else if (appProfile.is_updated_user_info === false) {
        router.replace(`/${clientConfig.slug}/member-info`);
      } else {
        router.replace(`/${clientConfig.slug}`);
      }
    }
  };

  const handleBackspace = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen flex flex-col items-center px-5">
      <div className="w-full pt-4">
        {step === "otp" && (
          <button
            className="rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm shrink-0"
            style={{
              background: clientConfig.ui.surface_color,
              border: `0.5px solid rgba(255,255,255,0.08)`,
              color: clientConfig.ui.text_color,
            }}
            onClick={() => {
              setStep("email");
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}
      </div>

      <div className="pt-7 pb-3">
        <img
          src={clientConfig.logo_url}
          alt="logo"
          className="h-[68px] w-auto rounded-[18px] bg-white"
          style={{
            boxShadow: `0 0 0 0.5px rgba(255,255,255,0.06), 0 4px 18px -4px color-mix(in oklch, ${clientConfig.ui.primary_color} 60%, transparent)`,
          }}
        />
      </div>

      {step === "email" && (
        <>
          <div
            className="text-xs font-bold font-mono mb-2 text-center"
            style={{
              color: clientConfig.ui.primary_color,
            }}
          >
            {clientConfig.name} MEMBER
          </div>
          <p
            className="font-bodoni text-[32px] font-medium"
            style={{
              color: clientConfig.ui.text_color,
            }}
          >
            Welcome
          </p>
          <div
            className="text-[13px] mb-7 text-center leading-[1.2]"
            style={{
              color: clientConfig.ui.text_gray_color,
            }}
          >
            กรุณาอีเมลของคุณเพื่อใช้รับข่าวสารใหม่ ๆ
          </div>

          <div
            className="flex w-full p-4 rounded-[14px] shadow"
            style={{
              background: clientConfig.ui.surface_color,
              border: `0.5px solid rgba(255,255,255,0.08)`,
              color: clientConfig.ui.text_gray_color,
            }}
          >
            {!!userProfile.pictureUrl && (
              <img
                src={userProfile.pictureUrl}
                className="w-14 h-14 rounded-full"
              />
            )}

            <div className="ml-4 flex flex-col justify-between">
              <div
                style={{
                  color: clientConfig.ui.primary_color,
                }}
              >
                ข้อมูลสมาชิก
              </div>

              <div className="text-[18px]">{userProfile.displayName}</div>
            </div>
          </div>

          <Input
            type="email"
            storageKey="verify-email"
            value={email}
            onChange={(value) => setEmail(value.trim())}
            icon={<Mail />}
            className="mt-5"
            placeholder="อีเมล"
          />

          <button
            style={{
              background: `linear-gradient(135deg, ${clientConfig.ui.primary_color}, ${clientConfig.ui.secondary_color})`,
              boxShadow: `0 8px 24px -6px color-mix(in oklch,${clientConfig.ui.primary_color} 60%, transparent)`,
              color: clientConfig.ui.button_text_color,
            }}
            className="mt-5 h-14 w-full text-center p-2 text-[15px] rounded-[14px] cursor-pointer flex gap-3 justify-center items-center"
            onClick={sendOtp}
          >
            ขอรหัส OTP
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <p
            className="text-xs font-bold font-mono mb-2 text-center"
            style={{
              color: clientConfig.ui.primary_color,
            }}
          >
            VERIFY OTP
          </p>
          <p
            className="text-2xl mb-2 text-center font-bodoni"
            style={{
              color: clientConfig.ui.text_color,
            }}
          >
            กรอกรหัส 6 หลัก
          </p>
          <div
            className="text-[13px] text-center"
            style={{
              color: clientConfig.ui.text_gray_color,
            }}
          >
            OTP มีอายุ 15 นาที (ref: {ref}) ถูกส่งไปที่
          </div>
          <p
            className="text-[13px] font-semibold font-mono text-center"
            style={{
              color: clientConfig.ui.text_color,
            }}
          >
            <b>{email}</b>
          </p>
          <div className="flex gap-2 mt-5">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleBackspace(e, index)}
                className="w-12 h-12 bg-white shadow-md border-2 rounded-lg text-center text-2xl font-bold outline-none"
                style={{
                  background: clientConfig.ui.surface_color,
                  border: `0.5px solid rgba(255,255,255,0.08)`,
                  color: clientConfig.ui.primary_color,
                }}
              />
            ))}
          </div>

          {countdown > 0 ? (
            <div
              className="mt-4 text-md"
              style={{
                color: clientConfig.ui.text_gray_color,
              }}
            >
              ส่ง OTP ใหม่ได้ใน {countdown} วินาที
            </div>
          ) : (
            <button
              className="mt-4 underline cursor-pointer"
              style={{
                color: clientConfig.ui.primary_color,
              }}
              onClick={sendOtp}
            >
              ส่ง OTP ใหม่
            </button>
          )}
        </>
      )}
    </div>
  );
}
