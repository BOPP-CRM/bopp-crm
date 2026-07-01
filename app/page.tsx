"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const url = new URL(window.location.href);

    const liffState = url.searchParams.get("liff.state");

    if (liffState) {
      url.searchParams.delete("liff.state");

      const query = url.searchParams.toString();
      const redirectUrl = query ? `${liffState}?${query}` : liffState;

      window.location.replace(redirectUrl);
    }
  }, []);

  return <div />;
}
