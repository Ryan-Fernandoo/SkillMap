"use client";

import { useEffect, useState } from "react";
import { getUserSubscription, isPremiumUser } from "@/lib/subscription";

export default function SubscriptionTestPage() {
  const [result, setResult] = useState("Mengecek...");

  useEffect(() => {
    async function checkSubscription() {
      const subscription = await getUserSubscription();
      const premium = await isPremiumUser();

      console.log("SUBSCRIPTION:", subscription);
      console.log("IS PREMIUM:", premium);

      setResult(
        JSON.stringify(
          {
            subscription,
            isPremium: premium,
          },
          null,
          2
        )
      );
    }

    checkSubscription();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <h1 className="text-2xl font-bold">
        Subscription Test
      </h1>

      <pre className="mt-6 rounded-xl bg-white p-6 text-sm shadow">
        {result}
      </pre>
    </main>
  );
}