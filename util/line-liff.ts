import type { Profile } from "@liff/get-profile";

async function getLiff() {
  if (typeof window === "undefined") {
    return null;
  }

  const { default: liff } = await import("@line/liff");
  return liff;
}

export async function getLiffUserProfile(
  liffId: string,
): Promise<Profile | undefined> {
  if (process.env.NEXT_PUBLIC_FORCE_USER_ID) {
    return {
      userId: process.env.NEXT_PUBLIC_FORCE_USER_ID,
      displayName: process.env.NEXT_PUBLIC_FORCE_USER_DISPLAY_NAME ?? "",
      pictureUrl: process.env.NEXT_PUBLIC_FORCE_USER_PICTURE_URL,
    };
  }

  if (!liffId || typeof window === "undefined") {
    return;
  }

  const liff = await getLiff();
  if (!liff) {
    return;
  }

  await liff.init({
    liffId: liffId,
  });

  if (!liff.isLoggedIn()) {
    liff.login({
      redirectUri: window.location.href,
    });
  }

  return await liff.getProfile();
}

export async function getLiffUserToken(liffId: string): Promise<string> {
  if (process.env.NEXT_PUBLIC_FORCE_USER_TOKEN) {
    return process.env.NEXT_PUBLIC_FORCE_USER_TOKEN;
  }
  
  if (!liffId || typeof window === "undefined") {
    return "";
  }

  const liff = await getLiff();
  if (!liff) {
    return "";
  }

  await liff.init({
    liffId: liffId,
  });

  return liff.getAccessToken() ?? "";
}
