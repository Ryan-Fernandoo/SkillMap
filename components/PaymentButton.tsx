"use client";

import { supabase } from "@/lib/supabase";

type SnapResult = unknown;

type SnapOptions = {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
};

type SnapWindow = Window & {
  snap?: {
    pay: (
      token: string,
      options?: SnapOptions
    ) => void;
  };
};

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
          data.detail ||
            data.error ||
            "Gagal membuat transaksi"
        );
      }

      // Ambil Snap dari window secara lokal
      const snap = (window as SnapWindow).snap;

      if (!snap) {
        throw new Error(
          "Midtrans Snap belum siap. Silakan refresh halaman dan coba lagi."
        );
      }

      snap.pay(data.token, {
        onSuccess: (result: unknown) => {
          console.log("Payment success:", result);
          alert("Pembayaran berhasil!");
        },

        onPending: (result: unknown) => {
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
    <button
      type="button"
      onClick={handlePayment}
    >
      Beli SkillMap Premium — Rp49.000
    </button>
  );
}