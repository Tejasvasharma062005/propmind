import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  UserCheck,
  Briefcase,
  Scale,
  HardHat,
  TrendingUp,
  AlertCircle,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import {
  registerStep1Schema,
  registerStep2Schema,
  otpSchema,
  type RegisterStep1FormData,
  type RegisterStep2FormData,
  type OtpFormData,
} from '@/schemas/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROLES } from '@/lib/constants';
import type { UserRole } from '@/types/auth.types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/components/listings';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Step 1 Form
  const {
    register: register1,
    handleSubmit: handleSubmit1,
    getValues: getValues1,
    formState: { errors: errors1 },
  } = useForm<RegisterStep1FormData>({
    resolver: zodResolver(registerStep1Schema),
    mode: 'onTouched',
  });

  // Step 2 Form
  const {
    handleSubmit: handleSubmit2,
    setValue: setValue2,
    watch: watch2,
    formState: { errors: errors2, isSubmitting: isSubmitting2 },
  } = useForm<RegisterStep2FormData>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { roles: ['BUYER'] },
  });

  const selectedRoles = watch2('roles') || [];

  // Step 3 Form (OTP)
  const {
    register: register3,
    handleSubmit: handleSubmit3,
    setValue: setValue3,
    formState: { errors: errors3, isSubmitting: isSubmitting3 },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Step 1 -> Step 2
  const onStep1Submit = () => {
    setApiError(null);
    setStep(2);
  };

  // Step 2 -> Call Register API -> Step 3
  const onStep2Submit = async (data: RegisterStep2FormData) => {
    setApiError(null);
    setResendSuccess(null);
    const step1Data = getValues1();
    try {
      const response = await authService.register({
        name: step1Data.name,
        email: step1Data.email,
        phone: step1Data.phone,
        password: step1Data.password,
        roles: data.roles as UserRole[],
      });

      const registeredId =
        response.data?.user_id ||
        response.data?.user?.id ||
        (response as unknown as { user_id?: string; user?: { id: string } }).user_id ||
        (response as unknown as { user?: { id: string } }).user?.id ||
        null;

      const returnedDevOtp =
        response.data?.dev_otp ||
        (response as unknown as { dev_otp?: string }).dev_otp ||
        null;

      const isSmtpReady = Boolean(response.data?.smtp_configured);

      setUserId(registeredId);
      setRegisteredEmail(step1Data.email);
      setDevOtp(returnedDevOtp);
      setSmtpConfigured(isSmtpReady);
      if (returnedDevOtp && !isSmtpReady) {
        setValue3('otp', returnedDevOtp, { shouldValidate: true });
      } else {
        setValue3('otp', '');
      }
      setStep(3);
    } catch (err: unknown) {
      setApiError(getErrorMessage(err));
    }
  };

  // Resend OTP on Step 3
  const handleResendOtp = async () => {
    setApiError(null);
    setResendSuccess(null);
    setIsResending(true);
    try {
      const response = await authService.resendOtp({
        user_id: userId || undefined,
        email: registeredEmail || getValues1().email,
        purpose: 'REGISTRATION',
      });
      const newUserId = response.data?.user_id;
      const newDevOtp = response.data?.dev_otp || null;
      const isSmtpReady = Boolean(response.data?.smtp_configured);
      if (newUserId) setUserId(newUserId);
      setDevOtp(newDevOtp);
      setSmtpConfigured(isSmtpReady);
      if (newDevOtp && !isSmtpReady) {
        setValue3('otp', newDevOtp, { shouldValidate: true });
      }
      setResendSuccess(
        isSmtpReady
          ? `A new 6-digit verification code has been emailed to ${registeredEmail}.`
          : 'A new 6-digit verification code has been generated.'
      );
    } catch (err: unknown) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  // Step 3 -> Verify OTP -> Done
  const onStep3Submit = async (data: OtpFormData) => {
    if (!userId) {
      setApiError('Missing user session ID. Please click "Resend new code" below.');
      return;
    }
    setApiError(null);
    try {
      await authService.verifyOtp({
        user_id: userId,
        otp: data.otp,
        purpose: 'REGISTRATION',
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err: unknown) {
      setApiError(getErrorMessage(err));
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    BUYER: <UserCheck className="w-5 h-5" />,
    SELLER: <Building className="w-5 h-5" />,
    AGENT: <Briefcase className="w-5 h-5" />,
    ADVOCATE: <Scale className="w-5 h-5" />,
    BUILDER: <HardHat className="w-5 h-5" />,
    INVESTOR: <TrendingUp className="w-5 h-5" />,
  };

  const toggleRole = (roleVal: string) => {
    const current = [...selectedRoles];
    const roleTyped = roleVal as UserRole;
    const exists = current.includes(roleTyped);
    let updated: UserRole[];
    if (exists) {
      if (current.length > 1) {
        updated = current.filter((r) => r !== roleTyped);
      } else {
        return; // at least 1 role
      }
    } else {
      updated = [...current, roleTyped];
    }
    setValue2('roles', updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Step {step} of 3
          </span>
          <span className="text-xs text-slate-500">
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Select Your Role'}
            {step === 3 && 'OTP Verification'}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {resendSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{resendSuccess}</span>
        </div>
      )}

      {/* STEP 1: Personal Info */}
      {step === 1 && (
        <form onSubmit={handleSubmit1(onStep1Submit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            leftIcon={<UserIcon className="w-4 h-4" />}
            error={errors1.name?.message}
            {...register1('name')}
            required
          />

          <Input
            type="email"
            label="Email Address"
            placeholder="rahul@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors1.email?.message}
            {...register1('email')}
            required
          />

          <Input
            type="tel"
            label="Phone Number"
            placeholder="9826012345"
            helperText="10-digit Indian mobile number for OTP verification"
            leftIcon={<Phone className="w-4 h-4" />}
            error={errors1.phone?.message}
            {...register1('phone')}
            required
          />

          <Input
            type="password"
            label="Create Password"
            placeholder="At least 8 chars with 1 uppercase & number"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors1.password?.message}
            {...register1('password')}
            required
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors1.password_confirm?.message}
            {...register1('password_confirm')}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="mt-4"
          >
            Continue to Role Selection
          </Button>
        </form>
      )}

      {/* STEP 2: Role Selection */}
      {step === 2 && (
        <form onSubmit={handleSubmit2(onStep2Submit)} className="space-y-4">
          <div className="text-left">
            <h4 className="text-base font-semibold text-slate-900">How do you plan to use PropMind?</h4>
            <p className="text-xs text-slate-500">You can select more than one role</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {ROLES.map((role) => {
              const isSelected = selectedRoles.includes(role.value as UserRole);
              return (
                <div
                  key={role.value}
                  onClick={() => toggleRole(role.value)}
                  className={cn(
                    'p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 select-none',
                    isSelected
                      ? 'border-primary-600 bg-primary-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0 transition-colors',
                      isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {roleIcons[role.value] || <Building className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{role.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{role.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {errors2.roles && (
            <p className="text-xs text-rose-600 font-medium">{errors2.roles.message}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting2}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Register & Send OTP
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: OTP Verification */}
      {step === 3 && (
        <form onSubmit={handleSubmit3(onStep3Submit)} className="space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-base font-semibold text-slate-900">Verify your Account</h4>
            <p className="text-xs text-slate-500">
              We generated a 6-digit verification code for{' '}
              <strong className="text-slate-800">{registeredEmail || 'your email'}</strong>
            </p>
          </div>

          {devOtp && !smtpConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Local Dev Mode (SMTP Not Configured)
                </span>
                <span className="font-mono text-sm font-bold tracking-widest bg-white px-2.5 py-0.5 rounded border border-amber-300 text-amber-950">
                  {devOtp}
                </span>
              </div>
              <p className="text-amber-700 leading-relaxed">
                Add <code className="font-mono bg-amber-100 px-1 rounded">EMAIL_HOST_USER</code> and <code className="font-mono bg-amber-100 px-1 rounded">EMAIL_HOST_PASSWORD</code> in <code className="font-mono bg-amber-100 px-1 rounded">.env</code> to send real emails to Gmail inboxes.
              </p>
            </div>
          )}

          <Input
            label="6-Digit OTP"
            placeholder="123456"
            maxLength={6}
            className="text-center text-xl tracking-widest font-mono"
            error={errors3.otp?.message}
            {...register3('otp')}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting3}
          >
            Verify & Go to Dashboard
          </Button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Roles / Info
            </button>
            <button
              type="button"
              disabled={isResending}
              onClick={handleResendOtp}
              className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isResending && 'animate-spin')} />
              {isResending ? 'Sending...' : 'Resend new code'}
            </button>
          </div>
        </form>
      )}

      <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Sign In
        </Link>
      </div>
    </div>
  );
};
