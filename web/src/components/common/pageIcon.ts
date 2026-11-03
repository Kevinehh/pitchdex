import type { LucideIcon } from "lucide-react"
import { createContext } from "react"

/**
 * The current page's icon, the same one as its sidebar link. AppLayout sets it from the address,
 * so every PageHeader shows it without each page passing it.
 */
export const PageIcon = createContext<LucideIcon | null>(null)
