import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email_or_phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data);
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message || 'Invalid credentials. Please try again.');
      } else {
        setApiError('Failed to sign in. Please verify your details.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-serif font-bold text-[#1C2420]">Sign in to your account</h3>
        <p className="text-xs text-[#5A625D] mt-1">
          Access your PropMind verified dashboard, listings, and property passports
        </p>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address or Phone Number"
          placeholder="name@example.com or 9826012345"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email_or_phone?.message}
          {...register('email_or_phone')}
          required
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Password <span className="text-rose-500">*</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
        Don't have an account yet?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
          Create an account
        </Link>
      </div>
    </div>
  );
};
