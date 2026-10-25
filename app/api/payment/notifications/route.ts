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
    // =========================
    // 1. Ambil notification
    // =========================

    const notification = await request.json();

    const {
      order_id,
      transaction_status,
      fraud_status,
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

    // =========================
    // 2. Verifikasi notification
    // =========================

    const statusResponse =
      await coreApi.transaction.notification(
        notification
      );

    const verifiedOrderId =
      statusResponse.order_id;

    const verifiedTransactionStatus =
      statusResponse.transaction_status;

    const verifiedFraudStatus =
      statusResponse.fraud_status;

    // =========================
    // 3. Cari subscription
    // =========================

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
      return NextResponse.json(
        {
          error: "Subscription tidak ditemukan.",
          order_id: verifiedOrderId,
        },
        { status: 404 }
      );
    }

    // =========================
    // 4. Tentukan status pembayaran
    // =========================

    let newStatus = "pending";
    let newPlan = subscription.plan;

    const isSuccess =
      verifiedTransactionStatus === "settlement" ||
      (
        verifiedTransactionStatus === "capture" &&
        verifiedFraudStatus !== "deny"
      );

    const isPending =
      verifiedTransactionStatus === "pending";

    const isFailed =
      verifiedTransactionStatus === "deny" ||
      verifiedTransactionStatus === "cancel" ||
      verifiedTransactionStatus === "expire";

    if (isSuccess) {
      newStatus = "active";
      newPlan = "premium";
    } else if (isPending) {
      newStatus = "pending";
      newPlan = "premium";
    } else if (isFailed) {
      newStatus = "failed";
      newPlan = "free";
    }

    // =========================
    // 5. Update subscription
    // =========================

    const updateData: {
      plan: string;
      status: string;
      provider: string;
      order_id: string;
      updated_at: string;
      started_at?: string;
      expires_at?: string;
    } = {
      plan: newPlan,
      status: newStatus,
      provider: "midtrans",
      order_id: verifiedOrderId,
      updated_at: new Date().toISOString(),
    };

    // =========================
    // 6. Jika berhasil
    // =========================

    if (isSuccess) {
      const startedAt = new Date();

      const expiresAt = new Date(startedAt);
      expiresAt.setMonth(
        expiresAt.getMonth() + 1
      );

      updateData.started_at =
        startedAt.toISOString();

      updateData.expires_at =
        expiresAt.toISOString();
    }

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("subscriptions")
      .update(updateData)
      .eq("order_id", verifiedOrderId);

    if (updateError) {
      throw updateError;
    }

    // =========================
    // 7. Response
    // =========================

    console.log("Midtrans notification processed:", {
      order_id: verifiedOrderId,
      transaction_status:
        verifiedTransactionStatus,
      fraud_status:
        verifiedFraudStatus,
      transaction_id,
      payment_type,
      subscription_status: newStatus,
      plan: newPlan,
    });

    return NextResponse.json({
      success: true,
      order_id: verifiedOrderId,
      status: newStatus,
      plan: newPlan,
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