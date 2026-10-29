import type { components } from "@/lib/api/schema"

export type Session = components["schemas"]["SessionDto"]
export type SignUpInput = components["schemas"]["SignUpCommand"]
export type SignInInput = components["schemas"]["SignInCommand"]
export type UpdateProfileInput = components["schemas"]["UpdateProfileCommand"]
export type ChangePasswordInput = components["schemas"]["ChangePasswordCommand"]
export type ResetPasswordInput = components["schemas"]["ResetPasswordCommand"]
