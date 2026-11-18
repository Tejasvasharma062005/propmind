import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/schemas/auth.schema';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get('user_id') || '';
  const devOtp = searchParams.get('dev_otp') || '';
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: devOtp,
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(null);
    try {
      await authService.resetPassword({
        user_id: userId,
        otp: data.otp,
        new_password: data.new_password,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message || 'Failed to reset password. Check OTP.');
      } else {
        setApiError('An error occurred during password reset.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-serif font-bold text-[#1C2420]">Set New Password</h3>
        <p className="text-xs text-[#5A625D] mt-1">
          Enter the 6-digit OTP you received and your new password
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
            <p className="font-semibold">Password Reset Successful!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Redirecting to login page...</p>
          </div>
        </div>
      )}

      {devOtp && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Local Dev OTP Preview
            </span>
            <span className="font-mono text-sm font-bold tracking-widest bg-white px-2.5 py-0.5 rounded border border-amber-300 text-amber-950">
              {devOtp}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="6-Digit Reset OTP"
          placeholder="123456"
          maxLength={6}
          className="text-center tracking-widest font-mono text-lg"
          leftIcon={<KeyRound className="w-4 h-4" />}
          error={errors.otp?.message}
          {...register('otp')}
          required
        />

        <Input
          type="password"
          label="New Password"
          placeholder="At least 8 characters with uppercase & number"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.new_password?.message}
          {...register('new_password')}
          required
        />

        <Input
          type="password"
          label="Confirm New Password"
          placeholder="Re-enter new password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
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
          Reset Password
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
