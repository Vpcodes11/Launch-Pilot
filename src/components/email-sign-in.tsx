"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function EmailSignIn({
  initialEmail = "",
  onSignedIn,
}: {
  initialEmail?: string;
  onSignedIn: (email: string) => void;
}) {
  const id = useId();
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is unavailable. Please try again later.");
      return;
    }

    setError("");
    setPending(true);
    try {
      if (!sentTo) {
        const address = email.trim();
        const result = await supabase.auth.signInWithOtp({ email: address });
        if (result.error) throw result.error;
        setSentTo(address);
        return;
      }

      const result = await supabase.auth.verifyOtp({
        email: sentTo,
        token: code.trim(),
        type: "email",
      });
      if (result.error || !result.data.session) throw result.error ?? new Error();
      onSignedIn(result.data.user?.email ?? sentTo);
    } catch {
      setError(sentTo
        ? "We couldn’t verify that code. Check it or request a new one."
        : "We couldn’t send a code. Check your email address or try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      {sentTo ? (
        <>
          <p role="status" className="break-words text-sm text-slate-300">
            Enter the sign-in code sent to <strong className="text-white">{sentTo}</strong>.
          </p>
          <label htmlFor={id + "-code"} className="block text-sm font-medium text-white">Sign-in code</label>
          <Input
            key="code"
            id={id + "-code"}
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]+"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={pending}
            required
          />
        </>
      ) : (
        <>
          <label htmlFor={id + "-email"} className="block text-sm font-medium text-white">Email address</label>
          <Input
            key="email"
            id={id + "-email"}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            required
          />
        </>
      )}
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="brand" disabled={pending} className="gap-2">
          {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : sentTo ? <ArrowRight aria-hidden="true" className="size-4" /> : <Mail aria-hidden="true" className="size-4" />}
          {sentTo ? "Verify code" : "Send sign-in code"}
        </Button>
        {sentTo && (
          <Button type="button" variant="ghost" disabled={pending} onClick={() => {
            setSentTo("");
            setCode("");
            setError("");
          }}>
            Start over
          </Button>
        )}
      </div>
    </form>
  );
}
