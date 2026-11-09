"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./auth";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";

function Gate({ children }) {
  const path = usePathname();
  const router = useRouter();
  const { user, loading, signedOut } = useAuth();
  const isLogin = path === "/login";

  useEffect(() => {
    if (loading || user || isLogin) return;
    router.replace(signedOut || path === "/" ? "/login" : `/login?next=${encodeURIComponent(path)}`);
  }, [loading, user, isLogin, signedOut, path, router]);

  if (isLogin) return children;
  if (!user) {
    return (
      <div className="grid place-content-center justify-items-center gap-5 min-h-screen" role="status" aria-label="Loading">
        <Logo className="w-[200px]" />
        <span className="size-[22px] rounded-full border-2 border-line-strong border-t-brand animate-spin" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] min-h-screen">
      <Sidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Shell({ children }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
