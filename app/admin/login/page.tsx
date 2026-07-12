"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { login } from "@/lib/admin/auth";
import { getErrorMessage } from "@/lib/admin/admin-client";
import { storeAdmin, useAdminAuth } from "@/lib/admin/use-admin-auth";
import { Logo } from "@/components/admin/ui/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAdminAuth();

  const clearError = () => {
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, admin } = await login(email, password);
      localStorage.setItem("adminToken", token);
      storeAdmin(admin);
      await refresh();
      router.replace("/admin");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f9] px-6">
      <div className="card w-full max-w-[400px] p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo height={48} />
          <p className="mt-3 text-sm text-slate-500">Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-900">
                  Couldn&apos;t sign you in
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-red-700">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              required
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!error}
              className={`input-base ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!error}
              className={`input-base ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        © {new Date().getFullYear()} GidTransfer
      </p>
    </div>
  );
}
