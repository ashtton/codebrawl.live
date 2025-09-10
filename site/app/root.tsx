import {
    isRouteErrorResponse,
    Outlet,
} from "react-router";

import type {Route} from "./+types/root";
import "./app.css";
import {rootAuthLoader} from "@clerk/react-router/ssr.server";
import {ClerkProvider, SignedIn, SignedOut, ClerkLoaded, ClerkLoading} from "@clerk/react-router";

export const links: Route.LinksFunction = () => [
    {rel: "preconnect", href: "https://fonts.googleapis.com"},
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
];

export async function loader(args: Route.LoaderArgs) {
    return rootAuthLoader(args);
}

export {Layout} from "./components/root/Layout";

import {Provider} from "react-redux";
import {store} from "./state/store";
import React from "react";
import {ConnectionOverlay} from "./components/root/ConnectionOverlay";
import {AutoConnect} from "./components/root/AutoConnect";
import {SignedOutPage} from "~/pages/SignedOut";
import {Toasts} from "./components/root/Toasts";

export default function App({loaderData}: Route.ComponentProps) {
    return (
        <ClerkProvider loaderData={loaderData}>
            <Provider store={store}>
                <ClerkLoading>
                    <div className="min-h-dvh bg-black"/>
                </ClerkLoading>
                <ClerkLoaded>
                    <SignedIn>
                        <ConnectionOverlay>
                            <Outlet/>
                        </ConnectionOverlay>
                        <AutoConnect/>
                    </SignedIn>
                    <SignedOut>
                        <SignedOutPage/>
                    </SignedOut>
                    <Toasts/>
                </ClerkLoaded>
            </Provider>
        </ClerkProvider>
    );
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
            )}
        </main>
    );
}
