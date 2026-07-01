import { GetUserPointHistoryRespont } from "@/types/request";
import { useApp } from "./providers/app-provider";
import { formatDate } from "@/util/format-date";

interface MenuCardProp {
  pointHistory: GetUserPointHistoryRespont;
}

export default function MenuCard({ pointHistory }: MenuCardProp) {
  const { clientConfig } = useApp();

  return (
    <div
      className="flex gap-3 p-3 mb-2 border-b-[0.5px]"
      style={{
        borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
      }}
    >
      <div className="flex-1 flex gap-3 items-center min-w-0">
        <img
          src={clientConfig.logo_url}
          alt="ads"
          className="w-9 h-9 rounded-full object-cover"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <div
            className="text-[13px] font-medium truncate"
            style={{ color: clientConfig.ui.text_color }}
          >
            {pointHistory.name}
          </div>
          <div className="text-gray-500 text-[11px] font-mono">
            {formatDate(pointHistory.given_date, {}, true)}
          </div>
        </div>
      </div>
      <div className="text-[19px] font-medium font-bodoni">
        {pointHistory.type === "earn" && (
          <div style={{ color: clientConfig.ui.text_success_color }}>
            + {pointHistory.value.toLocaleString()}
          </div>
        )}
        {pointHistory.type !== "earn" && (
          <div style={{ color: clientConfig.ui.text_error_color }}>
            - {pointHistory.value.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
