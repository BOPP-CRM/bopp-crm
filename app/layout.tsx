import "./globals.css";
import { Suspense } from "react";
import { AppProvider } from "@/components/providers/app-provider";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { FullLoadingProvider } from "@/components/providers/full-loading-provider";
import { AlertModalProvider } from "@/components/providers/alert-modal-provider";
import { ScannerModalProvider } from "@/components/providers/scanner-modal-provider";
import { ReceiptCameraModalProvider } from "@/components/providers/receipt-camera-modal-provider";
import { Viewport } from "next";

const notoSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansThai.variable} antialiased`}>
        <Suspense fallback={<div></div>}>
          <FullLoadingProvider>
            <AlertModalProvider>
              <ScannerModalProvider>
                <ReceiptCameraModalProvider>
                  <AppProvider>
                    <div className="container">{children}</div>
                  </AppProvider>
                </ReceiptCameraModalProvider>
              </ScannerModalProvider>
            </AlertModalProvider>
          </FullLoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
