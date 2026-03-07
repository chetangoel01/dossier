import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isApiAuthRoute = pathname.startsWith("/api/auth");
      const isAuthRoute = pathname === "/login" || pathname === "/signup";
      const isPublicRoute = pathname === "/";

      if (isApiAuthRoute) return true;

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dossiers", nextUrl));
        }
        return true;
      }

      if (isPublicRoute) return true;

      const isProtectedApiRoute =
        pathname.startsWith("/api/") && !isApiAuthRoute;

      if (isProtectedApiRoute && !isLoggedIn) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!isLoggedIn) return false;

      return true;
    },
  },
  providers: [],
};
