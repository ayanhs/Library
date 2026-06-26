"use client";

import { useRouter } from "next/navigation";
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
import { PasswordInput } from "@/components/auth/password-input";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";

export function SignupForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setFieldErrors({});

    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof SignupFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof SignupFormData;
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
      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            full_name: result.data.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setServerError("An account with this email already exists.");
        } else {
          setServerError(error.message);
        }
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Account created! Check your email to confirm your address, then sign in."
      );
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start publishing with AI-powered tools"
      footer={
        <>
          Already have an account?{" "}
          <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && <ErrorAlert message={serverError} />}
        {successMessage && <SuccessAlert message={successMessage} />}

        <FormField
          label="Full Name"
          htmlFor="fullName"
          error={fieldErrors.fullName}
        >
          <FormInput
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={formData.fullName}
            onChange={handleChange}
            disabled={isLoading}
          />
        </FormField>

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

        <FormField
          label="Password"
          htmlFor="password"
          error={fieldErrors.password}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            error={fieldErrors.password}
          />
        </FormField>

        <FormField
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={fieldErrors.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            error={fieldErrors.confirmPassword}
          />
        </FormField>

        <SubmitButton isLoading={isLoading}>Create Account</SubmitButton>
      </form>
    </AuthCard>
  );
}
