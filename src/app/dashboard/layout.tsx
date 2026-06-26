import { AiUsageStrip } from "@/components/ai-usage/ai-usage-strip";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-2 sm:px-6 lg:px-8">
        <div className="pointer-events-auto mx-auto max-w-6xl">
          <AiUsageStrip />
        </div>
      </div>
      <div className="pt-12">{children}</div>
      <FeedbackWidget />
    </>
  );
}
