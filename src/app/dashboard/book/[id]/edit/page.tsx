import { redirect, notFound } from "next/navigation";
import { BookForm } from "@/components/books/book-form";
import { getBookById } from "@/lib/books/queries";
import { bookToFormData } from "@/lib/books/utils";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";

interface EditBookPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const book = await getBookById(id, user.id);
  if (!book) notFound();

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <BookForm
          mode="edit"
          bookId={book.id}
          initialData={bookToFormData(book)}
          backHref={`/dashboard/book/${book.id}`}
        />
      </div>
    </div>
  );
}
