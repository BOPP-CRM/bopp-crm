"use client";
import Navbar from "@/components/navbar";
import SkeletonHome from "@/components/skeleton-home";
import { useApp } from "@/components/providers/app-provider";
import { isErrorResponse } from "@/types/request";
import { getLiffUserProfile } from "@/util/line-liff";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BOPP from "../../public/bopp_logo.png";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const pathname = usePathname();
  const [isWaiting, setIsWaiting] = useState<boolean>(true);
  const clientId = Array.isArray(params.clientId)
    ? params.clientId[0]
    : params.clientId;
  const {
    backendClient,
    clientConfig,
    userProfile,
    setClientConfig,
    setUserProfile,
    setAppUserProfile,
  } = useApp();

  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      const response = await backendClient.getPartnerAppConfig(clientId);
      if (isErrorResponse(response)) {
        window.location.href = "/";
        return;
      }
      setIsWaiting(true);
      setClientConfig(response);

      const liffId = response?.line?.liff_id ?? "";
      backendClient.setLiffId(liffId);

      const liffProfile = await getLiffUserProfile(liffId);
      setUserProfile(liffProfile);

      if (liffProfile) {
        const appProfile = await backendClient.getUserInfo(clientId);
        if (isErrorResponse(appProfile)) {
          window.location.href = `/${clientConfig.slug}`;
          return;
        }

        if (
          appProfile.force_verify_phone &&
          window.location.pathname !== `/${clientId}/verify-phone`
        ) {
          window.location.href = `/${clientId}/verify-phone`;
          return;
        }

        if (
          appProfile.force_verify_email &&
          window.location.pathname !== `/${clientId}/verify-email` &&
          window.location.pathname !== `/${clientId}/verify-phone`
        ) {
          window.location.href = `/${clientId}/verify-email`;
          return;
        }

        // if (
        //   appProfile.is_updated_user_info === false &&
        //   window.location.pathname !== `/${clientId}/member-info`
        // ) {
        //   window.location.href = `/${clientId}/member-info`;
        //   return;
        // }

        setAppUserProfile(appProfile);
        setIsWaiting(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!clientConfig.name) return;

    const { background_color } = clientConfig.ui;
    document.title = `${clientConfig.name} CRM`;
    document.body.style.backgroundColor = background_color;

    if (clientConfig.logo_url) {
      let favicon = document.querySelector(
        "link[rel='icon']",
      ) as HTMLLinkElement | null;

      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }

      favicon.href = clientConfig.logo_url;
    }

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [
    clientConfig.name,
    clientConfig.logo_url,
    clientConfig.ui.background_color,
  ]);

  if (!clientConfig || !userProfile) {
    return;
  }

  if (isWaiting && pathname !== `/${clientId}/member`) {
    return <SkeletonHome />;
  }

  return (
    <div
      className="min-h-dvh"
      style={{ backgroundColor: clientConfig.ui.background_color }}
    >
      {children}

      <div className="flex flex-col items-center gap-1 pt-10 pb-30">
        <p
          className="text-xs"
          style={{
            color: clientConfig.ui.text_gray_color,
          }}
        >
          Powered by
        </p>
        <img src={BOPP.src} alt="logo" className="w-20" />
      </div>

      <Navbar />
    </div>
  );
}
