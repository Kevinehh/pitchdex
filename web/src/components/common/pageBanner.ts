import { createContext, type ReactNode } from "react"

/** Shown under every page's header: the app shell passes in the first-time tip for the page. */
export const PageBanner = createContext<ReactNode>(null)
