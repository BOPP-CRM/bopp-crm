import React, { useMemo } from "react";
import ProgressBar from "./progress-bar";
import { useApp } from "./providers/app-provider";
import { IconArrowNarrowRight, IconSparklesFilled } from "@tabler/icons-react";

export default function TierCard() {
  const { clientConfig, userPoint, appUserProfile, userProfile } = useApp();

  const mainPoint = userPoint.find((point) => !point.currency.is_default);

  const tierInfo = useMemo(() => {
    const tiers = [...(clientConfig.tier || [])].sort(
      (a, b) => a.min_spending - b.min_spending,
    );
    const balance = mainPoint?.balance || 0;

    const currentTierFromProfile = tiers.find(
      (tier) => tier.code === appUserProfile?.tier?.code,
    );

    const currentTierByBalance =
      [...tiers].reverse().find((tier) => balance >= tier.min_spending) ||
      tiers[0];

    const currentTier = currentTierFromProfile || currentTierByBalance;
    const currentTierIndex = currentTier
      ? tiers.findIndex((tier) => tier.code === currentTier.code)
      : -1;
    const nextTier =
      currentTierIndex >= 0 && currentTierIndex < tiers.length - 1
        ? tiers[currentTierIndex + 1]
        : undefined;

    const rangeMin = currentTier?.min_spending || 0;
    const rangeMax =
      nextTier?.min_spending ||
      currentTier?.max_spending ||
      Math.max(balance, 1);

    const progressMax = Math.max(rangeMax - rangeMin, 1);
    const progressValue = nextTier
      ? Math.max(balance - rangeMin, 0)
      : progressMax;
    const remainingToNext = nextTier
      ? Math.max(nextTier.min_spending - balance, 0)
      : 0;

    return {
      balance,
      currentTier,
      nextTier,
      remainingToNext,
      targetValue: nextTier?.min_spending || currentTier?.max_spending || 0,
      progressValue,
      progressMax,
    };
  }, [appUserProfile?.tier?.code, clientConfig.tier, mainPoint?.balance]);

  return (
    <section
      className="mx-4.5 mb-5.5 rounded-[18px] pt-4 px-4.5 pb-3.5 border-[0.5px]"
      style={{
        background: clientConfig.ui.surface_color,
        color: clientConfig.ui.text_color,
        borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p
          className="flex items-center gap-1 text-xs leading-5"
          style={{
            color: clientConfig.ui.text_gray_color,
          }}
        >
          {tierInfo.currentTier?.name || "Member"}
          <IconArrowNarrowRight size={16} />
          {tierInfo.nextTier?.name || "ระดับสูงสุด"}
        </p>
        <p
          className="text-right text-xs font-mono leading-5"
          style={{
            color: clientConfig.ui.text_color,
          }}
        >
          {tierInfo.balance.toLocaleString()} /{" "}
          {tierInfo.targetValue.toLocaleString()}
        </p>
      </div>

      <ProgressBar
        value={mainPoint?.balance || 0}
        max={appUserProfile?.tier?.max_spending || 0}
        barClassName="bg-red-600"
        showValue={false}
      />

      <p
        className="mt-3 flex items-center gap-1 text-xs leading-5"
        style={{
          color: clientConfig.ui.text_gray_color,
        }}
      >
        {tierInfo.nextTier
          ? `${userProfile?.displayName || "คุณ"} อีก ${tierInfo.remainingToNext.toLocaleString()} แต้มก็จะเป็น ${tierInfo.nextTier.name} แล้ว`
          : "คุณอยู่ในระดับสูงสุดแล้ว"}
        <IconSparklesFilled size={16} />
      </p>
    </section>
  );
}
