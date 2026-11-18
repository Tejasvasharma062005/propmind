import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/auth.schema';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    try {
      const response = await authService.requestPasswordReset(data);
      const userId = response.data?.user_id;
      const devOtp = response.data?.dev_otp;
      setIsSuccess(true);
      setTimeout(() => {
        const otpParam = devOtp ? `&dev_otp=${encodeURIComponent(devOtp)}` : '';
        navigate(`/reset-password?user_id=${userId || ''}${otpParam}`);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message || 'Failed to request reset OTP.');
      } else {
        setApiError('An error occurred. Please verify your contact information.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-serif font-bold text-[#1C2420]">Forgot Password</h3>
        <p className="text-xs text-[#5A625D] mt-1">
          Enter your registered email or phone to receive a 6-digit reset code
        </p>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {isSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Reset Code Sent!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Redirecting to password reset screen...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Registered Email or Mobile"
          placeholder="name@example.com or 9826012345"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email_or_phone?.message}
          {...register('email_or_phone')}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          Send Verification Code
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
};
