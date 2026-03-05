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

      if (!isLoggedIn) return false;

      return true;
    },
  },
  providers: [],
};
