import { FeedbackWidget } from "@/components/feedback/feedback-widget";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FeedbackWidget />
    </>
  );
}
