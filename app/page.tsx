"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const authed = localStorage.getItem("admin_auth") === "true";
    router.replace(authed ? "/dashboard" : "/login");
  }, [router]);
  return null;
}
