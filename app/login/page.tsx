"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || "admin2026";

export default function LoginPage() {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Аль хэдийн нэвтэрсэн бол шууд dashboard руу
  useEffect(() => {
    if (localStorage.getItem("admin_auth") === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = () => {
    if (pass === ADMIN_PASS) {
      localStorage.setItem("admin_auth", "true");
      router.push("/dashboard");
    } else {
      setError("Нууц үг буруу байна");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center px-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🛍️</span>
          </div>
          <h1 className="text-[20px] font-semibold text-neutral-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Apple Store Mongolia
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Нууц үг"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-4 text-[14px] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
          />
          {error && (
            <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            onClick={handleLogin}
            className="h-11 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[14px] font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all"
          >
            Нэвтрэх
          </button>
        </div>
      </div>
    </div>
  );
}
