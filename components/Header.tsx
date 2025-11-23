"use client";

import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

export default function Header() {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 16,
        zIndex: 40,
        display: "flex",
        gap: 8,
      }}
    >
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal" redirectUrl="/dashboard">
          <button>Log in</button>
        </SignInButton>
        <SignUpButton
          mode="modal"
          afterSignUpUrl="/dashboard"
          afterSignInUrl="/dashboard"
        >
          <button>Create account</button>
        </SignUpButton>
      </SignedOut>
    </div>
  );
}
