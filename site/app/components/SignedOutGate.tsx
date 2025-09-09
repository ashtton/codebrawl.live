import React from "react";
import { SignInButton } from "@clerk/react-router";

export function SignedOutGate() {
  return (
    <div className="min-h-dvh grid place-items-center bg-neutral-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="text-lg">Please sign in to continue</div>
        <SignInButton />
      </div>
    </div>
  );
}
