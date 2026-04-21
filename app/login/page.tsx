"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || "admin2026";

export default function LoginPage() {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (pass === ADMIN_PASS) {
      localStorage.setItem("admin_auth", "true");
      router.push("/dashboard");
    } else {
      setError("Нууц үг буруу байна");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="bg-neutral-900 rounded-2xl p-8 w-full max-w-sm border border-neutral-800">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🛍️</span>
          </div>
          <h1 className="text-[20px] font-semibold text-white">Admin Dashboard</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Apple Store Mongolia</p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Нууц үг"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="h-11 rounded-xl bg-neutral-800 border border-neutral-700 px-4 text-[14px] text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
          />
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <button
            onClick={handleLogin}
            className="h-11 rounded-xl bg-white text-neutral-900 text-[14px] font-medium hover:bg-neutral-100 transition-all"
          >
            Нэвтрэх
          </button>
        </div>
      </div>
    </div>
  );
}