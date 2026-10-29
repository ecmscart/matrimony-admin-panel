"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().min(4, "Enter the code from your email"),
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/\d/, "Must include a number"),
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get("email") ?? "", otp: "", newPassword: "" },
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error("Too many attempts. Try again shortly.");
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Reset failed");
      }
      toast.success("Password reset. Please sign in.");
      router.replace("/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-xs text-(--color-danger)">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="otp">Reset code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...form.register("otp")}
        />
        {form.formState.errors.otp && (
          <p className="text-xs text-(--color-danger)">{form.formState.errors.otp.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
            {...form.register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-(--color-muted-foreground) hover:text-(--color-foreground)"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.newPassword && (
          <p className="text-xs text-(--color-danger)">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Reset password
      </Button>
      <p className="text-center text-sm text-(--color-muted-foreground)">
        <Link href="/login" className="hover:text-(--color-foreground)">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <Image
          src="/logo.png"
          alt="Maher Admin"
          width={961}
          height={734}
          className="h-14 w-auto mb-2"
          priority
        />
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>Enter the code sent to your email and a new password</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Loader2 className="mx-auto h-4 w-4 animate-spin" />}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
