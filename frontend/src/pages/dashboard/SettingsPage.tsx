import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/components/listings';
import { formatDate } from '@/lib/utils';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isProfessional = hasRole(['AGENT', 'ADVOCATE', 'VERIFIER', 'NEGOTIATOR']);

  const { data: profileRes, isLoading: loadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userService.getProfile(),
  });

  const { data: profRes } = useQuery({
    queryKey: ['professional-profile'],
    queryFn: () => userService.getProfessionalProfile(),
    enabled: isProfessional,
  });

  const profileUser = profileRes?.data || user;

  const [name, setName] = useState('');
  const [city, setCity] = useState('Indore');
  const [stateName, setStateName] = useState('Madhya Pradesh');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [profession, setProfession] = useState<'AGENT' | 'ADVOCATE' | 'VERIFIER' | 'NEGOTIATOR'>('AGENT');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [yearsExp, setYearsExp] = useState('0');
  const [profSuccess, setProfSuccess] = useState<string | null>(null);
  const [profError, setProfError] = useState<string | null>(null);

  useEffect(() => {
    if (profileUser) {
      setName(profileUser.name || '');
      setCity(profileUser.profile?.city || 'Indore');
      setStateName(profileUser.profile?.state || 'Madhya Pradesh');
      setAddress(profileUser.profile?.address || '');
      setBio(profileUser.profile?.bio || '');
    }
  }, [profileUser]);

  useEffect(() => {
    const prof = profRes?.data;
    if (prof) {
      setProfession(prof.profession);
      setLicenseNumber(prof.license_number || '');
      setAgencyName(prof.agency_name || '');
      setYearsExp(String(prof.years_experience ?? 0));
    }
  }, [profRes]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      userService.updateProfile({
        name: name.trim(),
        city: city.trim(),
        state: stateName.trim(),
        address: address.trim(),
        bio: bio.trim(),
      }),
    onSuccess: async () => {
      setProfileError(null);
      setProfileSuccess('Your profile settings have been saved.');
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err) => {
      setProfileSuccess(null);
      setProfileError(getErrorMessage(err));
    },
  });

  const saveProfMutation = useMutation({
    mutationFn: () =>
      userService.saveProfessionalProfile({
        profession,
        license_number: licenseNumber.trim(),
        agency_name: agencyName.trim(),
        years_experience: Number(yearsExp) || 0,
      }),
    onSuccess: () => {
      setProfError(null);
      setProfSuccess('Professional credentials updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['professional-profile'] });
    },
    onError: (err) => {
      setProfSuccess(null);
      setProfError(getErrorMessage(err));
    },
  });

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-[#1B3126]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="eyebrow-label mb-1.5">
          <span>ACCOUNT & PREFERENCES</span>
          <span className="h-px w-10 bg-[#8C8474]/60" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1C2420]">Account Settings</h1>
        <p className="text-sm text-[#5A625D] mt-0.5">
          Manage your personal profile, Indore contact details, active roles, and professional credentials
        </p>
      </div>

      {/* Account Overview Strip */}
      <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171715] text-[#F8F4E9] border-[#494431]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[#F8F4E9]">{profileUser?.name}</h2>
            <Badge variant={profileUser?.is_verified ? 'success' : 'warning'} size="sm">
              {profileUser?.is_verified ? 'Email Verified' : 'Unverified'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#D8C9A7]">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#C3A66B]" /> {profileUser?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#C3A66B]" /> {profileUser?.phone}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(profileUser?.roles || []).map((r) => (
              <span
                key={r}
                className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#494431]/40 text-[#C3A66B] border border-[#C3A66B]/30 font-semibold"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2 text-xs text-[#D8C9A7]">
          {profileUser?.created_at && (
            <span>Member since {formatDate(profileUser.created_at)}</span>
          )}
          <Link to="/dashboard/kyc">
            <Button variant="secondary" size="sm" leftIcon={<ShieldCheck className="w-4 h-4 text-[#171715]" />}>
              Open KYC & Compliance
            </Button>
          </Link>
        </div>
      </Card>

      {/* Personal Profile Form */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#EFEAE0] pb-4">
          <UserIcon className="w-5 h-5 text-[#1B3126]" />
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1C2420]">Personal Profile</h3>
            <p className="text-xs text-[#5A625D]">
              Update your display name, address, and bio visible to transaction counterparties
            </p>
          </div>
        </div>

        {profileError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="rounded-xl border border-[#C5D7CB] bg-[#E6EDE8] p-3 text-sm text-[#1B3126] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#4E6B58]" />
            {profileSuccess}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfileMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Registered Email"
              value={profileUser?.email || ''}
              disabled
              helperText="Email cannot be changed directly"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
            />
          </div>

          <Input
            label="Street / Office Address"
            placeholder="e.g. Vijay Nagar, Indore"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A544E] mb-1.5">
              Bio / About
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Briefly describe your real estate requirements or expertise..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CCB9] rounded-xl text-sm text-[#1C2420] focus:outline-none focus:ring-2 focus:ring-[#1B3126]"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={updateProfileMutation.isPending}
            >
              Save Profile Settings
            </Button>
          </div>
        </form>
      </Card>

      {/* Professional Credentials (Agents, Advocates, Verifiers, Negotiators) */}
      {isProfessional && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-[#EFEAE0] pb-4">
            <Briefcase className="w-5 h-5 text-[#1B3126]" />
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C2420]">
                Professional Credentials & RERA / Bar License
              </h3>
              <p className="text-xs text-[#5A625D]">
                Required for verified Agents, Legal Advocates, Property Verifiers, and Negotiators
              </p>
            </div>
          </div>

          {profError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {profError}
            </div>
          )}
          {profSuccess && (
            <div className="rounded-xl border border-[#C5D7CB] bg-[#E6EDE8] p-3 text-sm text-[#1B3126] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4E6B58]" />
              {profSuccess}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProfMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Profession"
                value={profession}
                onChange={(e) =>
                  setProfession(e.target.value as 'AGENT' | 'ADVOCATE' | 'VERIFIER' | 'NEGOTIATOR')
                }
                options={[
                  { value: 'AGENT', label: 'RERA Real Estate Agent / Broker' },
                  { value: 'ADVOCATE', label: 'Legal Advocate' },
                  { value: 'VERIFIER', label: 'Property Verification Specialist' },
                  { value: 'NEGOTIATOR', label: 'Deal Negotiator' },
                ]}
              />
              <Input
                label="RERA / Bar Council License No."
                placeholder="e.g. A-IND-24-0921 or MP/BAR/2018/441"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Agency / Law Firm Name"
                placeholder="e.g. Malwa Realty Associates"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
              <Input
                label="Years of Experience"
                type="number"
                min={0}
                max={60}
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="outline"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={saveProfMutation.isPending}
              >
                Save Professional Credentials
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
