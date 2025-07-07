"use client";

import type React from "react";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { addActivity, ActivityActionType } from "@/lib/firestore";
import { Button } from "@/components/atomics/button";
import { Input } from "@/components/atomics/input";
import { Label } from "@/components/atomics/label";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { Alert, AlertDescription } from "./molecules/Alert.molecule";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect is handled by the AuthProvider

      // Add activity log for login
      if (auth.currentUser) {
        await addActivity({
          userId: auth.currentUser.uid,
          type: "auth",
          action: ActivityActionType.AUTH_LOGIN,
          status: "unread", // Pastikan status unread agar muncul di notifikasi
          targetId: auth.currentUser.uid,
          targetName:
            auth.currentUser.displayName || auth.currentUser.email || "User",
          details: {
            message: `${auth.currentUser.displayName || auth.currentUser.email} logged in.`,
          },
        });
      }
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else {
        setError("Failed to sign in");
        console.error(error);
      }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner className="mr-2" /> : null}
        Sign In
      </Button>
      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
