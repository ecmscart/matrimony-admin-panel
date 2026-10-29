export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-(--color-surface-muted) to-(--color-surface) p-4">
      {children}
    </div>
  );
}
