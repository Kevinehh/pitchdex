import { z } from "zod"

/** Same rule as the API: length matters more than symbols. */
export const MIN_PASSWORD = 10

const password = z
  .string()
  .min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters`)
  .max(128, "Use at most 128 characters")

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean(),
})

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(100),
  lastName: z.string().trim().min(1, "Enter your last name").max(100),
  email: z.email("Enter a valid email address").max(256),
  password,
})

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
})

export const resetPasswordSchema = z.object({ newPassword: password })

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(100),
  lastName: z.string().trim().min(1, "Enter your last name").max(100),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: password,
})

export type SignInForm = z.infer<typeof signInSchema>
export type SignUpForm = z.infer<typeof signUpSchema>
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>
export type ProfileForm = z.infer<typeof profileSchema>
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>
