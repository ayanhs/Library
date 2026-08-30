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
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <NewBookForm />
      </div>
    </div>
  );
}
