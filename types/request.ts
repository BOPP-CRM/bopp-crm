export interface ErrorResponse {
  error: string;
  message: string;
}

export const isErrorResponse = (data: unknown): data is ErrorResponse => {
  if (data == null || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return typeof record.error === "string" && typeof record.message === "string";
};

export interface PartnerAppConfig {
  id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  logo_url: string;

  line: {
    liff_id: string;
  };

  ui: {
    banner: string;
    background_color: string;
    background_white_color: string;
    primary_color: string;
    secondary_color: string;
    surface_color: string;

    text_color: string;
    text_white_color: string;
    text_gray_color: string;
    text_success_color: string;
    text_error_color: string;

    button_color: string;
    button_text_color: string;

    welcome_title: string;

    crm_required_phone: boolean;
    crm_required_email: boolean;

    ui_custom_fields: UiCustomField[];
  };

  ads: AdsItem[];
  tier: Tier[];
  warranty: WarrantyOptionResponse;
}

export interface AdsItem {
  id: number;
  title: string;
  action: string;
  image_url: string;
  start_date: string;
  end_date: string;
  message: string;
}

export interface UiCustomField {
  key: string;
  value: string;
}

export function normalizeUiCustomFields(fields: unknown): UiCustomField[] {
  if (Array.isArray(fields)) {
    return fields.filter(
      (field): field is UiCustomField =>
        field != null &&
        typeof field === "object" &&
        typeof field.key === "string" &&
        typeof field.value === "string",
    );
  }

  if (fields && typeof fields === "object") {
    return Object.entries(fields as Record<string, unknown>)
      .filter(([, value]) => value != null)
      .map(([key, value]) => ({ key, value: String(value) }));
  }

  return [];
}

export function normalizePartnerAppConfig(
  config: PartnerAppConfig,
): PartnerAppConfig {
  return {
    ...config,
    ui: {
      ...config.ui,
      ui_custom_fields: normalizeUiCustomFields(config.ui?.ui_custom_fields),
    },
  };
}

export const initPartnerAppConfig = (): PartnerAppConfig => ({
  id: 0,
  name: "",
  slug: "",
  description: "",
  active: false,
  logo_url: "",

  line: {
    liff_id: "",
  },

  ui: {
    banner: "",
    background_color: "",
    background_white_color: "",
    primary_color: "",
    secondary_color: "",
    surface_color: "",

    text_color: "",
    text_white_color: "",
    text_gray_color: "",
    text_success_color: "",
    text_error_color: "",

    button_color: "",
    button_text_color: "",

    welcome_title: "ยินดีต้อนรับ",

    crm_required_phone: true,
    crm_required_email: false,

    ui_custom_fields: [],
  },

  ads: [],
  tier: [],
  warranty: {
    enabled: false,
    products: [],
    contributors: [],
  },
});

export interface User {
  id: number;
  display_name: string;
  picture_url: string;
  line_user_id: string;
  birth_date: string;
  gender: string;
  email: string;
  phone: string;
  force_verify_phone: boolean;
  force_verify_email: boolean;
  is_updated_user_info: boolean;
  tier: Tier;
  address?: string;
}

export interface UserInfoPayload {
  display_name: string;
  picture_url: string;
  birth_date: string;
  gender: "M" | "F" | "O";
  email: string;
  phone: string;
  address?: string;
}

export interface Tier {
  code: string;
  name: string;
  min_spending: number;
  max_spending: number;
  color: string;
  image_url: string;
}

export interface SubmitPhoneRequest {
  userId: string;
  phone: string;
}

export interface SubmitPhoneResponse {
  ref: string;
}

export interface VerifyPhoneRequest {
  ref: string;
  otp: string;
}

export interface SubmitEmailRequest {
  userId: string;
  email: string;
}

export interface SubmitEmailResponse {
  ref: string;
}

export interface VerifyEmailRequest {
  ref: string;
  otp: string;
}

export interface Currency {
  id: number;
  name: string;
  is_default: boolean;
}

export interface GetUserPointRespont {
  currency: Currency;
  earn: number;
  transfer: number;
  burn: number;
  balance: number;
}

export interface GetUserPointHistoryRespont {
  id: number;
  name: string;
  value: number;
  type: "earn" | "burn" | "tranfer";
  given_date: string;
  expiration_date: string;
  currency: Currency;
}

export interface Redeem {
  code: string;
  name: string;
  value: number;
  type: "earn" | "burn" | "tranfer";
  limit_per_user: number;
  limit_per_qr: number;
  redeemed_count: number;
  expiration_date: number;
  active: boolean;
  currency: Currency;
  reward_coupon: RewardCoupon;
}

export interface RewardCoupon {
  id: number;
  name: string;
  image_url: string;
  value: number;
}

export interface CouponType {
  id: number;
  name: string;
  image_url: string;
  value: number;
  start_time: string;
  end_time: string;
  code_expiry_interval: number;
  redeemed_count: number;
  term_and_condition: string;
  currency: Currency;
}

export interface UserCoupon {
  id: number;
  name: string;
  code: string;
  value: string;
  acquired_date: string;
  activated_date: string | false;
  expiration_date: string | false;
  state: "redeemed" | "activated" | "used" | "expired";
  is_used: boolean;
  used_date: string | false;
  currency: Currency;
  coupon: {
    id: number;
    name: string;
    term_and_condition: string;
    image_url: string;
  };
  point: {
    id: number;
    value: string;
    type: "earn" | "burn" | "tranfer";
  };
}

export interface UserReceipt {
  id: number;
  receipt_number: string;
  receipt_image_url: string;
  amount: number;
  state: "pending" | "approved" | "rejected";
  submitted_date: string;
  reward_point?: RewardPoint;
}

export interface RewardPoint {
  id: number;
  name: string;
  value: number;
  type: "earn" | "burn" | "tranfer";
  given_date: string;
  currency: {
    id: number;
    name: string;
    is_default: boolean;
    is_total_spending: boolean;
  };
}

export interface WarrantyOptionResponse {
  enabled: boolean;
  products: WarrantyProduct[];
  contributors: WarrantyContributor[];
}

export interface WarrantyProduct {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
}

export interface WarrantyContributor {
  id: number;
  name: string;
}

export interface WarrantySubmissionRequest {
  warranties: WarrantyRequest[];
}

export interface WarrantyRequest {
  product_id: number;
  contributor_id: number;
  serial_number: string;
  receipt_number: string;
  purchase_date: string;
  receipt_image: string;
}

export interface WarrantyResponse {
  warranty: Warranty;
}

export interface ListWarrantyResponse {
  warranties: Warranty[];
}

export interface Warranty {
  id: number;
  serial_number: string;
  receipt_number: string;
  purchase_date: string;
  receipt_image_url: string;
  submitted_date: string;
  product: WarrantyProduct;
  contributor: WarrantyContributor;
  status: WarrantyStatus;
}

export interface WarrantyStatus {
  id: number;
  code: string;
  label: string;
  color: string;
  is_default: boolean;
}
