import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// @ts-ignore
import midtransClient from "midtrans-client";

const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // =====================================================
    // 1. Ambil notification dari Midtrans
    // =====================================================

    const notification = await request.json();

    const {
      order_id,
      transaction_id,
      payment_type,
    } = notification;

    if (!order_id) {
      return NextResponse.json(
        {
          error: "Order ID tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. Verifikasi notification ke Midtrans
    // =====================================================

    const statusResponse =
      await coreApi.transaction.notification(
        notification
      );

    const verifiedOrderId =
      statusResponse.order_id;

    const transactionStatus =
      statusResponse.transaction_status;

    const fraudStatus =
      statusResponse.fraud_status;

    // =====================================================
    // 3. Cari subscription berdasarkan order_id
    // =====================================================

    const {
      data: subscription,
      error: subscriptionError,
    } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("order_id", verifiedOrderId)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (!subscription) {
      console.error(
        "Subscription tidak ditemukan:",
        verifiedOrderId
      );

      return NextResponse.json(
        {
          error: "Subscription tidak ditemukan.",
          order_id: verifiedOrderId,
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 4. Tentukan status transaksi
    // =====================================================

    const isSuccess =
      transactionStatus === "settlement" ||
      (
        transactionStatus === "capture" &&
        fraudStatus !== "deny"
      );

    const isPending =
      transactionStatus === "pending";

    const isFailed =
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire";

    // =====================================================
    // 5. Jika pembayaran berhasil
    // =====================================================

    if (isSuccess) {
      const now = new Date();

      /*
       * Hindari memperpanjang subscription berkali-kali
       * jika Midtrans mengirim notification settlement
       * lebih dari satu kali.
       */
      const alreadyActive =
        subscription.plan === "premium" &&
        subscription.status === "active" &&
        subscription.started_at &&
        subscription.expires_at;

      if (alreadyActive) {
        const { error: updateError } =
          await supabaseAdmin
            .from("subscriptions")
            .update({
              provider: "midtrans",
              updated_at: now.toISOString(),
            })
            .eq("id", subscription.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const startedAt = now;

        const expiresAt = new Date(startedAt);
        expiresAt.setMonth(
          expiresAt.getMonth() + 1
        );

        const { error: updateError } =
          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan: "premium",
              status: "active",
              billing_cycle: "monthly",
              provider: "midtrans",
              order_id: verifiedOrderId,
              started_at:
                startedAt.toISOString(),
              expires_at:
                expiresAt.toISOString(),
              updated_at:
                now.toISOString(),
            })
            .eq("id", subscription.id);

        if (updateError) {
          throw updateError;
        }
      }

      console.log(
        "Premium berhasil diaktifkan:",
        {
          order_id: verifiedOrderId,
          transaction_id,
          payment_type,
        }
      );

      return NextResponse.json({
        success: true,
        order_id: verifiedOrderId,
        status: "active",
        plan: "premium",
      });
    }

    // =====================================================
    // 6. Jika pembayaran masih pending
    // =====================================================

    if (isPending) {
      const { error: updateError } =
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "premium",
            status: "pending",
            billing_cycle: "monthly",
            provider: "midtrans",
            order_id: verifiedOrderId,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", subscription.id);

      if (updateError) {
        throw updateError;
      }

      console.log(
        "Pembayaran masih pending:",
        verifiedOrderId
      );

      return NextResponse.json({
        success: true,
        order_id: verifiedOrderId,
        status: "pending",
        plan: "premium",
      });
    }

    // =====================================================
    // 7. Jika pembayaran gagal / dibatalkan / expired
    // =====================================================

    if (isFailed) {
      const { error: updateError } =
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "free",
            status: "failed",
            provider: "midtrans",
            order_id: verifiedOrderId,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", subscription.id);

      if (updateError) {
        throw updateError;
      }

      console.log(
        "Pembayaran gagal:",
        {
          order_id: verifiedOrderId,
          transaction_status:
            transactionStatus,
        }
      );

      return NextResponse.json({
        success: true,
        order_id: verifiedOrderId,
        status: "failed",
        plan: "free",
      });
    }

    // =====================================================
    // 8. Status lain dari Midtrans
    // =====================================================

    console.log(
      "Status transaksi belum ditangani:",
      {
        order_id: verifiedOrderId,
        transaction_status:
          transactionStatus,
        fraud_status:
          fraudStatus,
      }
    );

    return NextResponse.json({
      success: true,
      order_id: verifiedOrderId,
      status: transactionStatus,
      plan: subscription.plan,
    });
  } catch (error) {
    console.error(
      "Midtrans notification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Gagal memproses notification Midtrans.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}