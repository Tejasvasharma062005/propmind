import { z } from 'zod';

export const loginSchema = z.object({
  email_or_phone: z
    .string()
    .min(3, 'Email or Phone is required')
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[6-9]\d{9}$/;
      return emailRegex.test(val) || phoneRegex.test(val.replace(/\s+/g, ''));
    }, 'Enter a valid email address or 10-digit Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerStep1Schema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

export type RegisterStep1FormData = z.infer<typeof registerStep1Schema>;

export const registerStep2Schema = z.object({
  roles: z
    .array(
      z.enum([
        'BUYER',
        'SELLER',
        'AGENT',
        'ADVOCATE',
        'BUILDER',
        'INVESTOR',
        'ADMIN',
        'NEGOTIATOR',
        'VERIFIER',
      ])
    )
    .min(1, 'Please select at least one role to continue'),
});

export type RegisterStep2FormData = z.infer<typeof registerStep2Schema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain numbers only'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({
  email_or_phone: z
    .string()
    .min(3, 'Email or Phone is required')
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[6-9]\d{9}$/;
      return emailRegex.test(val) || phoneRegex.test(val.replace(/\s+/g, ''));
    }, 'Enter a valid email address or 10-digit Indian phone number'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
