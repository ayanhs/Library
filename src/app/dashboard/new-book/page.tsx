import { redirect } from "next/navigation";
import { NewBookForm } from "@/components/books/new-book-form";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";

export default async function NewBookPage() {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-blue/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <NewBookForm />
      </div>
    </div>
  );
}
