import type { ComponentType } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import { AppLoading } from "@/app/AppLoading"
import { RouteError } from "@/app/RouteError"
import type { RouteHandle } from "@/app/routeHandle"
import { redirectIfSignedIn, requireSession } from "@/app/sessionLoaders"
import { AppLayout } from "@/layouts/AppLayout"
import { AuthLayout } from "@/layouts/AuthLayout"

// Each page is its own chunk, downloaded the first time someone opens it.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

export const router = createBrowserRouter([
  {
    // Signed-out screens. Sign-in and sign-up skip ahead for someone already signed in;
    // the password pages work either way.
    element: <AuthLayout />,
    hydrateFallbackElement: <AppLoading />,
    errorElement: <RouteError />,
    children: [
      {
        loader: redirectIfSignedIn,
        children: [
          { path: "sign-in", lazy: page(() => import("@/pages/SignInPage")) },
          { path: "sign-up", lazy: page(() => import("@/pages/SignUpPage")) },
        ],
      },
      { path: "forgot-password", lazy: page(() => import("@/pages/ForgotPasswordPage")) },
      { path: "reset-password", lazy: page(() => import("@/pages/ResetPasswordPage")) },
    ],
  },
  {
    // Everything else needs a signed-in founder; without one, the loader sends them to sign in.
    element: <AppLayout />,
    loader: requireSession,
    hydrateFallbackElement: <AppLoading />,
    errorElement: <RouteError />,
    children: [
      {
        // Errors inside a page show here, and the sidebar stays usable.
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", lazy: page(() => import("@/pages/DashboardPage")) },
          {
            path: "explore",
            lazy: page(() => import("@/pages/ExplorePage")),
            handle: { wide: true } satisfies RouteHandle,
          },
          { path: "campaigns", lazy: page(() => import("@/pages/CampaignsPage")) },
          { path: "campaigns/:id", lazy: page(() => import("@/pages/CampaignPage")) },
          {
            path: "leads",
            lazy: page(() => import("@/pages/LeadsPage")),
            handle: { wide: true } satisfies RouteHandle,
          },
          {
            // The open conversation is in the address, so it can be linked to and survives a refresh.
            path: "inbox/:leadId?",
            lazy: page(() => import("@/pages/InboxPage")),
            handle: { wide: true } satisfies RouteHandle,
          },
          { path: "analytics", lazy: page(() => import("@/pages/AnalyticsPage")) },
          { path: "resources", lazy: page(() => import("@/pages/ResourcesPage")) },
          { path: "account", lazy: page(() => import("@/pages/AccountPage")) },
          { path: "settings", lazy: page(() => import("@/pages/SettingsPage")) },
          { path: "*", lazy: page(() => import("@/pages/NotFoundPage")) },
        ],
      },
    ],
  },
])
