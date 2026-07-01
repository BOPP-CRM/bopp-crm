"use client";
import type { Profile } from "@liff/get-profile";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type OpenAlertOptions,
  useAlertModalContext,
} from "./alert-modal-provider";
import {
  type OpenReceiptOptions,
  useReceiptCameraModalContext,
} from "./receipt-camera-modal-provider";
import {
  type OpenScannerOptions,
  useScannerModalContext,
} from "./scanner-modal-provider";
import { useFullLoadingContext } from "./full-loading-provider";
import { BackendClient } from "@/util/request";
import {
  GetUserPointRespont,
  initPartnerAppConfig,
  PartnerAppConfig,
  User,
} from "@/types/request";

interface AppContextType {
  userProfile: Profile | undefined;
  setUserProfile: (value: Profile | undefined) => void;
  setFullLoading: (value: boolean) => void;
  backendClient: BackendClient;
  clientConfig: PartnerAppConfig;
  setClientConfig: (value: PartnerAppConfig) => void;
  appUserProfile: User | undefined;
  setAppUserProfile: (value: User | undefined) => void;
  userPoint: GetUserPointRespont[];
  setUserPoint: (value: GetUserPointRespont[]) => void;
  isShowNavbar: boolean;
  setIsShowNavbar: (value: boolean) => void;
  openAlert: (options: OpenAlertOptions) => Promise<void>;
  closeAlert: () => void;
  openScanner: (options?: OpenScannerOptions) => void;
  closeScanner: () => void;
  openReceipt: (options?: OpenReceiptOptions) => void;
  closeReceipt: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<Profile | undefined>();
  const [appUserProfile, setAppUserProfile] = useState<User | undefined>();
  const [clientConfig, setClientConfig] = useState<PartnerAppConfig>(
    initPartnerAppConfig(),
  );
  const setFullLoading = useFullLoadingContext();
  const backendClientRef = useRef<BackendClient | null>(null);

  if (!backendClientRef.current) {
    backendClientRef.current = new BackendClient(
      setFullLoading,
      clientConfig.line.liff_id,
    );
  }

  const backendClient = backendClientRef.current;

  useEffect(() => {
    backendClient.setLiffId(clientConfig.line.liff_id);
  }, [backendClient, clientConfig.line.liff_id]);
  const [userPoint, setUserPoint] = useState<GetUserPointRespont[]>([]);
  const [isShowNavbar, setIsShowNavbar] = useState<boolean>(true);
  const {
    openAlert: openAlertModal,
    closeAlert,
    setAlertClientConfig,
  } = useAlertModalContext();
  const { openScanner: openScannerModal, closeScanner } =
    useScannerModalContext();
  const { openReceipt: openReceiptModal, closeReceipt } =
    useReceiptCameraModalContext();

  useEffect(() => {
    setAlertClientConfig(clientConfig);
  }, [clientConfig, setAlertClientConfig]);

  const openScanner = useCallback(
    (options: OpenScannerOptions = {}) => {
      closeReceipt();
      openScannerModal(options);
    },
    [closeReceipt, openScannerModal],
  );

  const openAlert = useCallback(
    (options: OpenAlertOptions) => {
      return openAlertModal({ ...options });
    },
    [openAlertModal],
  );

  const openReceipt = useCallback(
    (options: OpenReceiptOptions = {}) => {
      closeScanner();
      openReceiptModal({
        ...options,
        clientConfig,
      });
    },
    [closeScanner, openReceiptModal, clientConfig],
  );

  const value: AppContextType = useMemo(
    () => ({
      userProfile,
      setUserProfile,
      setFullLoading,
      backendClient,
      clientConfig,
      setClientConfig,
      appUserProfile,
      setAppUserProfile,
      userPoint,
      setUserPoint,
      isShowNavbar,
      setIsShowNavbar,
      openAlert,
      closeAlert,
      openScanner,
      closeScanner,
      openReceipt,
      closeReceipt,
    }),
    [
      userProfile,
      setUserProfile,
      setFullLoading,
      backendClient,
      clientConfig,
      setClientConfig,
      appUserProfile,
      setAppUserProfile,
      userPoint,
      setUserPoint,
      isShowNavbar,
      setIsShowNavbar,
      openAlert,
      closeAlert,
      openScanner,
      closeScanner,
      openReceipt,
      closeReceipt,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
