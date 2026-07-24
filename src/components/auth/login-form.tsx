"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthCard,
  AuthLink,
  ErrorAlert,
  FormField,
  FormInput,
  SubmitButton,
} from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/admin/constants";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const authError = searchParams.get("error");

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authError === "auth_callback_failed") {
      setServerError(
        "Email confirmation failed or the link expired. Sign in, or request a new confirmation email."
      );
    }
  }, [authError]);

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

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setServerError("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setServerError(
            "Please confirm your email address before signing in."
          );
        } else {
          setServerError(error.message);
        }
        return;
      }

      const destination = isAdminEmail(data.user?.email)
        ? "/admin"
        : redirectTo;

      router.push(destination);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to your publishing studio"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <AuthLink href="/signup">Create one</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField
          label="Email"
          htmlFor="email"
          error={fieldErrors.email}
        >
          <FormInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
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
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            error={fieldErrors.password}
          />
        </FormField>

        <div className="flex justify-end">
          <AuthLink href="/forgot-password">Forgot Password?</AuthLink>
        </div>

        <SubmitButton isLoading={isLoading}>Sign In</SubmitButton>
      </form>
    </AuthCard>
  );
}
