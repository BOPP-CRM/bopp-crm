import {
  ErrorResponse,
  normalizePartnerAppConfig,
  PartnerAppConfig,
  SubmitPhoneRequest,
  SubmitPhoneResponse,
  User,
  VerifyPhoneRequest,
  SubmitEmailRequest,
  SubmitEmailResponse,
  VerifyEmailRequest,
  GetUserPointRespont,
  GetUserPointHistoryRespont,
  Redeem,
  UserCoupon,
  CouponType,
  UserInfoPayload,
  UserReceipt,
  WarrantyOptionResponse,
  WarrantySubmissionRequest,
  Warranty as WarrantyItem,
} from "@/types/request";
import axios, { AxiosInstance } from "axios";
import { getLiffUserToken } from "./line-liff";

const handlerError = (error: unknown): ErrorResponse => {
  if (axios.isAxiosError(error)) {
    if (error.status === 403) {
      return {
        error: "session_expired",
        message: "Session expired. Please login again.",
      };
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.message
    ) {
      return {
        error: error.response.data.error,
        message: error.response.data.message,
      };
    } else {
      return {
        error: error.message,
        message: error.message,
      };
    }
  } else {
    return {
      error: "unkmown",
      message: "An unknow error occurred. try again!",
    };
  }
};

export class BackendClient {
  private readonly client: AxiosInstance;
  private readonly setLoading: (value: boolean) => void;
  private liffId: string;
  private authPromise: Promise<string> | null = null;

  constructor(setLoading: (value: boolean) => void, liffId: string) {
    this.client = axios.create({
      baseURL: "/api",
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.setLoading = setLoading;
    this.liffId = liffId;

    this.client.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  setLiffId(liffId: string) {
    if (this.liffId !== liffId) {
      this.liffId = liffId;
      this.authPromise = null;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (typeof window === "undefined" || !this.liffId) {
      return "";
    }

    if (!this.authPromise) {
      this.authPromise = getLiffUserToken(this.liffId).catch((error) => {
        this.authPromise = null;
        throw error;
      });
    }

    return this.authPromise;
  }

  async getPartnerAppConfig(
    clientId: string,
  ): Promise<ErrorResponse | PartnerAppConfig> {
    try {
      const response = await this.client.get(`/partner/${clientId}`);

      return normalizePartnerAppConfig(response.data);
    } catch (e) {
      return handlerError(e);
    }
  }

  async getUserInfo(clientId: string): Promise<ErrorResponse | User> {
    try {
      const response = await this.client.get(`/partner/${clientId}/user`);

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async submitPhone(
    clientId: string,
    payload: SubmitPhoneRequest,
  ): Promise<ErrorResponse | SubmitPhoneResponse> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/submit-phone`,
        payload,
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async verifyPhone(
    clientId: string,
    payload: VerifyPhoneRequest,
  ): Promise<ErrorResponse | void> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/verify-phone`,
        payload,
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async submitEmail(
    clientId: string,
    payload: SubmitEmailRequest,
  ): Promise<ErrorResponse | SubmitEmailResponse> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/submit-email`,
        payload,
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async verifyEmail(
    clientId: string,
    payload: VerifyEmailRequest,
  ): Promise<ErrorResponse | void> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/verify-email`,
        payload,
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getUserPoint(
    clientId: string,
    userId: string,
  ): Promise<ErrorResponse | GetUserPointRespont[]> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/user/${userId}/point`,
      );

      return response.data.points;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getUserPointHistory(
    clientId: string,
    userId: string,
  ): Promise<ErrorResponse | GetUserPointHistoryRespont[]> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/user/${userId}/point-history`,
      );

      return response.data.point_history;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getRedeemDetail(
    clientId: string,
    code: string,
  ): Promise<ErrorResponse | Redeem> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/redeem/${code}`,
      );

      return response.data.redeem;
    } catch (e) {
      return handlerError(e);
    }
  }

  async redeemCode(
    clientId: string,
    code: string,
    userId: string,
  ): Promise<
    ErrorResponse | { point?: GetUserPointHistoryRespont; coupon?: UserCoupon }
  > {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/redeem/${code}`,
        {
          line_user_id: userId,
        },
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async listCoupon(clientId: string): Promise<ErrorResponse | CouponType[]> {
    try {
      const response = await this.client.get(`/partner/${clientId}/coupon`);

      return response.data.coupon;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getCouponDetailById(
    clientId: string,
    id: string,
  ): Promise<ErrorResponse | CouponType> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/coupon/${id}`,
      );

      return response.data.coupon;
    } catch (e) {
      return handlerError(e);
    }
  }

  async redeemCoupon(
    clientId: string,
    couponId: number,
  ): Promise<ErrorResponse | UserCoupon> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/coupon/${couponId}/redeem`,
      );

      return response.data.coupon;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getUserCoupon(clientId: string): Promise<ErrorResponse | UserCoupon[]> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/user/coupon`,
      );

      return response.data.coupon;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getUserCouponById(
    clientId: string,
    couponId: string,
  ): Promise<ErrorResponse | UserCoupon> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/user/coupon/${couponId}`,
      );

      return response.data.coupon;
    } catch (e) {
      return handlerError(e);
    }
  }

  async activateCoupon(
    clientId: string,
    couponCode: string,
  ): Promise<ErrorResponse | UserCoupon> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/user/coupon/${couponCode}/activate`,
      );

      return response.data.coupon;
    } catch (e) {
      return handlerError(e);
    }
  }

  async onUseCoupon(
    clientId: string,
    couponCode: string,
  ): Promise<ErrorResponse | UserCoupon> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/user/coupon/${couponCode}/use`,
      );

      return response.data.coupon;
    } catch (e) {
      return handlerError(e);
    }
  }

  async submitReceipt(
    clientId: string,
    userId: string,
    receiptNumber: string,
    receiptImage: string,
  ): Promise<ErrorResponse | void> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/user/${userId}/receipt`,
        {
          receipt_number: receiptNumber,
          receipt_image: receiptImage,
        },
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getUserReceipt(
    clientId: string,
    userId: string,
  ): Promise<ErrorResponse | UserReceipt[]> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/user/${userId}/receipt`,
      );

      return response.data.receipts;
    } catch (e) {
      return handlerError(e);
    }
  }

  async updateUserInfo(
    clientId: string,
    userInfo: Partial<UserInfoPayload>,
  ): Promise<ErrorResponse> {
    try {
      const response = await this.client.put(
        `/partner/${clientId}/user`,
        userInfo,
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getWarrantyOptions(
    clientId: string,
  ): Promise<ErrorResponse | WarrantyOptionResponse> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/warranty/options`,
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async submitWarranty(
    clientId: string,
    request: WarrantySubmissionRequest,
  ): Promise<ErrorResponse | void> {
    try {
      const response = await this.client.post(
        `/partner/${clientId}/user/warranty`,
        request,
      );

      return response.data;
    } catch (e) {
      return handlerError(e);
    }
  }

  async listUserWarranties(
    clientId: string,
  ): Promise<ErrorResponse | WarrantyItem[]> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/user/warranty`,
      );

      return response.data.warranties;
    } catch (e) {
      return handlerError(e);
    }
  }

  async getUserWarrantyById(
    clientId: string,
    warrantyId: string,
  ): Promise<ErrorResponse | WarrantyItem> {
    try {
      const response = await this.client.get(
        `/partner/${clientId}/user/warranty/${warrantyId}`,
      );

      return response.data.warranty;
    } catch (e) {
      return handlerError(e);
    }
  }
}
