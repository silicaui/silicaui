"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  FieldLabel,
  Heading,
  Input,
  PasswordInput,
  Text,
} from "@wizeworks/silicaui-react";

/** Seeded for the run — the console has no real auth behind it. */
const SEEDED = { email: "dilnoza@peregrine.uz", password: "riga-rotterdam-2026" };

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    setBusy(false);
    if (email !== SEEDED.email || password !== SEEDED.password) {
      // One outcome, one cause. Saying "email or password" would be one message
      // covering two different fixes; this console has six staff and no public
      // signup, so there is no account-enumeration reason to blur it.
      setError(
        email !== SEEDED.email
          ? "No account for that address. Peregrine addresses end in @peregrine.uz."
          : "That password is not right for this account.",
      );
      return;
    }
    location.href = "/";
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1">
        <Heading level={1}>Peregrine Ops</Heading>
        <Text size="sm">Sign in to the operations console.</Text>
      </div>

      {error ? (
        <Alert color="error" role="alert">
          {error}
        </Alert>
      ) : null}

      <Field>
        <FieldLabel>Work email</FieldLabel>
        <Input
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@peregrine.uz"
          className="w-full"
        />
      </Field>

      <Field>
        <FieldLabel>Password</FieldLabel>
        <PasswordInput
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
        />
      </Field>

      <Checkbox name="remember">Keep me signed in on this machine</Checkbox>

      <Button type="submit" color="primary" loading={busy}>
        Sign in
      </Button>
    </form>
  );
}
