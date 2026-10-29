"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center space-y-3">
        <div className="text-6xl font-semibold">404</div>
        <p className="text-(--color-muted-foreground)">
          The page you are looking for does not exist.
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
