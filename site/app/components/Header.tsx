import React from "react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/react-router";

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-40">
      <div className="relative h-14">
        <div className="absolute top-2 right-3">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
