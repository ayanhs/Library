"use client";

import { useState } from "react";
import {
  AuthCard,
  AuthLink,
  ErrorAlert,
  FormField,
  FormInput,
  SubmitButton,
  SuccessAlert,
} from "@/components/auth/auth-card";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ForgotPasswordFormData, string>>
  >({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    setFieldErrors({});
    setServerError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setFieldErrors({});

    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof ForgotPasswordFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ForgotPasswordFormData;
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
      const { error } = await supabase.auth.resetPasswordForEmail(
        result.data.email,
        {
          redirectTo: `${window.location.origin}/login`,
        }
      );

      if (error) {
        setServerError(error.message);
        return;
      }

      setSuccessMessage(
        "If an account exists for that email, we've sent password reset instructions."
      );
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <>
          Remember your password?{" "}
          <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && <ErrorAlert message={serverError} />}
        {successMessage && <SuccessAlert message={successMessage} />}

        <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
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

        <SubmitButton isLoading={isLoading}>Send Reset Link</SubmitButton>
      </form>
    </AuthCard>
  );
}
