"use client";

import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export default function PaymentButton() {
  const handlePayment = async () => {
    try {
      // Ambil session user yang sedang login
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("Silakan login terlebih dahulu.");
        return;
      }

      // Kirim access token ke backend
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Payment API error:", data);
        throw new Error(
          data.detail || data.error || "Gagal membuat transaksi"
        );
      }

      window.snap.pay(data.token, {
        onSuccess: (result) => {
          console.log("Payment success:", result);
          alert("Pembayaran berhasil!");
        },

        onPending: (result) => {
          console.log("Payment pending:", result);
          alert("Pembayaran sedang diproses.");
        },

        onError: (result) => {
          console.log("Payment error:", result);
          alert("Pembayaran gagal.");
        },

        onClose: () => {
          console.log("Payment popup ditutup");
        },
      });
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat pembayaran."
      );
    }
  };

  return (
    <button onClick={handlePayment}>
      Beli SkillMap Premium — Rp49.000
    </button>
  );
}