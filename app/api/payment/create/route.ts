import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// @ts-ignore
import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
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
    // 1. Ambil access token
    // =========================

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "User belum terautentikasi.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.replace("Bearer ", "");

    // =========================
    // 2. Verifikasi user
    // =========================

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Session user tidak valid.",
        },
        { status: 401 }
      );
    }

    // =========================
    // 3. Tentukan transaksi
    // =========================

    const orderId =
      `SKILLMAP-${Date.now()}`;

    const amount = 49000;

    // =========================
    // 4. Simpan/update subscription
    // =========================

    const {
      data: existingSubscription,
      error: subscriptionFindError,
    } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionFindError) {
      throw subscriptionFindError;
    }

    if (existingSubscription) {
      const {
        error: subscriptionUpdateError,
      } = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan: "premium",
          status: "pending",
          billing_cycle: "monthly",
          amount,
          provider: "midtrans",
          order_id: orderId,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          existingSubscription.id
        );

      if (subscriptionUpdateError) {
        throw subscriptionUpdateError;
      }
    } else {
      const {
        error: subscriptionInsertError,
      } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: "premium",
          status: "pending",
          billing_cycle: "monthly",
          amount,
          provider: "midtrans",
          order_id: orderId,
        });

      if (subscriptionInsertError) {
        throw subscriptionInsertError;
      }
    }

    // =========================
    // 5. Buat transaksi Midtrans
    // =========================

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
    };

    const transaction =
      await snap.createTransaction(
        parameter
      );

    // =========================
    // 6. Kirim token ke frontend
    // =========================

    return NextResponse.json({
      token: transaction.token,
      redirect_url:
        transaction.redirect_url,
      order_id: orderId,
    });
  } catch (error) {
    console.error(
      "Payment create error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Gagal membuat transaksi",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}