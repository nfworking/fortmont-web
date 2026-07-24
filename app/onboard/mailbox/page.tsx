"use client";
import {MailboxOnboarding} from "@/temp_move/components/mail/mailbox";
import { useRouter } from "next/dist/client/components/navigation";
import { Metadata } from "next";



export default function MailboxOnboardingPage() {
  const router = useRouter();

  return <MailboxOnboarding 
  onComplete={async (email, password) => {
  const res = await fetch("/api/mailbox/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to create mailbox"); // ← throw, don't console.error
  }

  router.push("/dashboard/account");
  router.refresh();
}}
  />;
}