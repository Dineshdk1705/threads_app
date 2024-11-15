import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
    // An array of public routes that don't require authentication.
    publicRoutes: ['/', "/api/webhook/clerk"],

    // An array of routes to be ignored by the authentication middleware.
    ignoredRoutes: ["/api/webhook/clerk"],
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};