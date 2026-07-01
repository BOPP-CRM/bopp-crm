/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./providers/app-provider";
import { formatDate } from "@/util/format-date";
import { AdsItem } from "@/types/request";

export default function NewsSection() {
  const { clientConfig } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAdsItem, setSelectedAdsItem] = useState<AdsItem | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const adsItems = clientConfig.ads;

  const scrollToCard = useCallback((index: number) => {
    const cardElement = cardRefs.current[index];
    const scrollerElement = scrollerRef.current;

    if (!cardElement || !scrollerElement) return;

    scrollerElement.scrollTo({
      left: cardElement.offsetLeft,
      behavior: "smooth",
    });
  }, []);

  const goToPrevious = useCallback(() => {
    if (adsItems.length <= 1) return;
    const nextIndex =
      currentIndex === 0 ? adsItems.length - 1 : currentIndex - 1;
    scrollToCard(nextIndex);
  }, [adsItems.length, currentIndex, scrollToCard]);

  const goToNext = useCallback(() => {
    if (adsItems.length <= 1) return;
    const nextIndex =
      currentIndex === adsItems.length - 1 ? 0 : currentIndex + 1;
    scrollToCard(nextIndex);
  }, [adsItems.length, currentIndex, scrollToCard]);

  useEffect(() => {
    if (adsItems.length <= 1) return;

    const intervalId = window.setInterval(() => {
      const nextIndex =
        currentIndex === adsItems.length - 1 ? 0 : currentIndex + 1;
      scrollToCard(nextIndex);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [adsItems.length, currentIndex, scrollToCard]);

  if (adsItems.length === 0) {
    return null;
  }

  const handleScroll = () => {
    const scrollerElement = scrollerRef.current;
    if (!scrollerElement) return;

    const scrollLeft = scrollerElement.scrollLeft;
    let nearestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((cardElement, index) => {
      if (!cardElement) return;

      const distance = Math.abs(cardElement.offsetLeft - scrollLeft);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestIndex = index;
      }
    });

    setCurrentIndex((previousIndex) =>
      previousIndex === nearestIndex ? previousIndex : nearestIndex,
    );
  };

  return (
    <section className="mx-4.5 mb-5.5">
      <div className="mb-4 flex items-center justify-between px-0.5 text-white">
        <p
          className="text-xl leading-none font-medium font-bodoni"
          style={{ color: clientConfig.ui.text_color }}
        >
          ประกาศข่าวสาร
        </p>
      </div>

      <div className="relative">
        {/* {adsItems.length > 1 && (
          <button
            type="button"
            aria-label="Previous advertisement"
            onClick={goToPrevious}
            className="absolute left-2 top-[38%] z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm"
          >
            <IconChevronLeft size={18} />
          </button>
        )} */}

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
        >
          {adsItems.map((adsItem, index) => {
            return (
              <div
                key={`${adsItem.id}-${index}`}
                className="block w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/8 bg-[#111111] text-left shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] disabled:cursor-default sm:w-[78%] cursor-pointer"
                onClick={() => setSelectedAdsItem(adsItem)}
              >
                <img
                  src={adsItem.image_url}
                  alt={`ads-${index + 1}`}
                  className="w-full object-cover aspect-video"
                />

                <div className="space-y-1 bg-[#161616] px-3.5 pt-3 pb-3.5 text-white">
                  <p
                    className="text-[10px] font-semibold font-mono truncate"
                    style={{
                      color: clientConfig.ui.primary_color,
                    }}
                  >
                    {[
                      formatDate(adsItem.start_date),
                      formatDate(adsItem.end_date),
                    ].join(" • ")}
                  </p>

                  <p className="text-lg font-medium font-bodoni line-clamp-2 mt-1">
                    {adsItem.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* {adsItems.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Next advertisement"
              onClick={goToNext}
              className="absolute right-2 top-[38%] z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm"
            >
              <IconChevronRight size={18} />
            </button> 

            <div className="mt-4 flex items-center justify-center gap-2">
              {adsItems.map((adsItem, index) => (
                <button
                  key={`indicator-${adsItem.id}-${index}`}
                  type="button"
                  aria-label={`Go to advertisement ${index + 1}`}
                  onClick={() => scrollToCard(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === index
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/25"
                  }`}
                />
              ))}
            </div>
          </>
        )} */}
      </div>

      {selectedAdsItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedAdsItem(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl text-white overflow-hidden h-[90vh] flex flex-col"
            style={{
              background: clientConfig.ui.surface_color,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5">
              <div className="space-y-1">
                <h3 className="text-2xl font-medium font-bodoni leading-tight">
                  {selectedAdsItem.title}
                </h3>
                <p
                  className="text-[10px] font-semibold font-mono"
                  style={{ color: clientConfig.ui.primary_color }}
                >
                  {[
                    formatDate(selectedAdsItem.start_date),
                    formatDate(selectedAdsItem.end_date),
                  ].join(" • ")}
                </p>
              </div>
            </div>
            <img
              src={selectedAdsItem.image_url}
              alt={selectedAdsItem.title}
              className="w-full "
            />

            <div className="px-5 pt-4 pb-8 space-y-3 flex-1 flex flex-col overflow-y-auto">
              {selectedAdsItem.message && (
                <p className="text-sm text-white/70 leading-relaxed flex-1">
                  {selectedAdsItem.message}
                </p>
              )}

              {selectedAdsItem.action && (
                <>
                  <a
                    href={selectedAdsItem.action}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block w-full rounded-xl py-3 text-center text-sm font-semibold"
                    style={{
                      backgroundColor: clientConfig.ui.primary_color,
                      color: clientConfig.ui.text_color,
                    }}
                  >
                    ดูเพิ่มเติม
                  </a>
                </>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedAdsItem(null)}
                className="mb-1 rounded-xl py-2.5 text-sm font-semibold border"
                style={{
                  background: clientConfig.ui.surface_color,
                  color: clientConfig.ui.text_color,
                  borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
