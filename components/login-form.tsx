"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigRight, ArrowUpRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

type LoginFormProps = React.ComponentProps<"form"> & {
  callbackUrl: string;
};
export function LoginForm({
   className,
  callbackUrl,
  ...props
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        setError("Invalid username or password.");
        return;
      }

      router.push(result?.url ?? "/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntraLogin = async () => {
    try {
      setIsLoading2(true);
      setError(null);
      await signIn("microsoft-entra-id", { callbackUrl: callbackUrl });
    } finally {
      setIsLoading2(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleLogin} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your username below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="your.username"
            required
            className="bg-background"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="bg-background"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Login"}
          </Button>
        </Field>
        <FieldSeparator>continue with</FieldSeparator>
        <Field>
         
           <Button variant="outline" type="button"
           onClick={handleEntraLogin}
           disabled={isLoading2}
           >
          
   {isLoading2 ? "Signing in..." : "Login with Entra ID"}<ArrowUpRight/>
          </Button >
            <Button variant="outline" type="button"
           onClick={() => (window.location.href = "/mail")}
           >
          Access Fortmont Webmail<ArrowUpRight/>
          </Button >
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4">
              Signup
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
