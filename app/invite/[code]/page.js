import { createClient } from "@supabase/supabase-js";
import InviteCard from "./InviteCard";

const APP_DESCRIPTION = "Log mood, sleep, steps & meals in under 30 seconds a day. Watch your avatar evolve and keep streaks alive with friends — private by design, your health data stays yours.";

export async function generateMetadata({ params }) {
  const { code } = await params;
  let inviterName = null;
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.rpc("invite_inviter_first_name", { invite_code: code });
    inviterName = data || null;
  } catch (e) {
    console.error("generateMetadata: invite lookup failed:", e);
  }

  const title = inviterName ? `${inviterName} invited you to Health Pop 💛` : "You're invited to Health Pop 💛";

  return {
    title,
    description: APP_DESCRIPTION,
    openGraph: { title, description: APP_DESCRIPTION, type: "website" },
    twitter: { card: "summary_large_image", title, description: APP_DESCRIPTION },
  };
}

export default function InvitePage() {
  return <InviteCard />;
}
