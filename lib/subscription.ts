import { supabase } from "@/lib/supabase";

export type SubscriptionPlan = "free" | "premium";

export type Subscription = {
  id: number;
  user_id: string;
  plan: SubscriptionPlan;
  status: string;
  billing_cycle: string | null;
  amount: number;
  provider: string | null;
  order_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getUserSubscription(): Promise<Subscription | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Gagal membaca subscription:", error);
    return null;
  }

  return data as Subscription | null;
}

export async function isPremiumUser(): Promise<boolean> {
  const subscription = await getUserSubscription();

  return (
    subscription?.plan === "premium" &&
    subscription?.status === "active"
  );
}