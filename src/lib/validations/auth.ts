import { z } from "zod";

export const emailSchema = z.email("Enter a valid email address").trim().toLowerCase().max(254);
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters")
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), "Include at least one letter and one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const profileSchema = z.object({ name: z.string().trim().min(1, "Enter your name").max(80) });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
