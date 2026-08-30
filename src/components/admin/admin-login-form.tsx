"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ErrorAlert,
  FormField,
  FormInput,
  SubmitButton,
} from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { isAdminEmail } from "@/lib/admin/constants";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

export function AdminLoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setFieldErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginFormData;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    if (!isAdminEmail(result.data.email)) {
      setServerError("This console is restricted to authorized administrators.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setServerError("Invalid email or password.");
        } else {
          setServerError(error.message);
        }
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Sign in failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card gradient-border rounded-2xl p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Admin Console
        </h2>
        <p className="mt-2 text-sm text-muted">
          Authorized access only — platform statistics &amp; management
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label="Admin email" htmlFor="email" error={fieldErrors.email}>
          <FormInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={fieldErrors.password}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter admin password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            error={fieldErrors.password}
          />
        </FormField>

        <SubmitButton isLoading={isLoading} className="from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/25">
          Sign in to Admin
        </SubmitButton>
      </form>
    </div>
  );
}
