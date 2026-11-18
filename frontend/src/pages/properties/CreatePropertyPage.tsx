import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Home,
  LandPlot,
  Briefcase,
  Store,
  Trees,
  Crown,
  MapPin,
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  IndianRupee,
  Layers,
} from 'lucide-react';
import {
  fullPropertyCreateSchema,
  type FullPropertyCreateFormData,
} from '@/schemas/property.schema';
import { propertyService } from '@/services/property.service';
import type { PropertyType } from '@/types/property.types';
import { PROPERTY_TYPES, INDORE_LOCALITIES, AMENITIES_LIST, BHK_OPTIONS } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatArea, cn } from '@/lib/utils';

export const CreatePropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deedFile, setDeedFile] = useState<File | null>(null);
  const [deedType, setDeedType] = useState('SALE_DEED');
  const [deedRef, setDeedRef] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FullPropertyCreateFormData>({
    resolver: zodResolver(fullPropertyCreateSchema) as never,
    defaultValues: {
      property_type: 'APARTMENT',
      city: 'Indore',
      state: 'Madhya Pradesh',
      locality: 'Vijay Nagar',
      amenities: ['Reserved Car Parking', 'Power Backup (100%)', 'Gated Security & CCTV'],
    },
    mode: 'onTouched',
  });

  const selectedType = watch('property_type');
  const selectedAmenities = watch('amenities') || [];
  const formValues = watch();

  const propertyIcons: Record<string, React.ReactNode> = {
    APARTMENT: <Building2 className="w-6 h-6" />,
    INDEPENDENT_HOUSE: <Home className="w-6 h-6" />,
    PLOT: <LandPlot className="w-6 h-6" />,
    COMMERCIAL_OFFICE: <Briefcase className="w-6 h-6" />,
    COMMERCIAL_SHOP: <Store className="w-6 h-6" />,
    AGRICULTURAL_LAND: <Trees className="w-6 h-6" />,
    PENTHOUSE: <Crown className="w-6 h-6" />,
  };

  const handleNextStep = async () => {
    setErrorMessage(null);
    let isValid = false;

    if (step === 1) {
      isValid = await trigger(['property_type']);
      if (isValid) setStep(2);
    } else if (step === 2) {
      isValid = await trigger(['address', 'locality', 'city', 'state', 'pincode']);
      if (isValid) setStep(3);
    } else if (step === 3) {
      isValid = await trigger(['title', 'description', 'price', 'carpet_area_sqft']);
      if (isValid) setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = [...selectedAmenities];
    const exists = current.includes(amenity);
    const updated = exists ? current.filter((a) => a !== amenity) : [...current, amenity];
    setValue('amenities', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: FullPropertyCreateFormData) => {
    setErrorMessage(null);
    try {
      const createdRes = await propertyService.createProperty(data);
      const createdId = createdRes.data?.id;
      if (createdId && deedFile) {
        await propertyService.uploadDocument(
          createdId,
          deedFile,
          deedType,
          `${deedType} — ${data.title}`,
          deedRef
        );
        await propertyService.submitVerification(createdId);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/listings/new');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message || 'Failed to list property. Please check the values.');
      } else {
        setErrorMessage('Failed to create property. Please try again.');
      }
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#1C2420]">Property Listed Successfully!</h2>
        <p className="text-[#5A625D] text-sm max-w-md mx-auto">
          Your listing has been submitted for PropMind Legal Title Verification. Our Indore verification team will review the title deeds within 24 hours.
        </p>
        <div className="pt-4">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header & Steps Breadcrumb */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C2420]">Register Your Property</h1>
        <p className="text-sm text-[#5A625D] mt-1">
          Complete the 5-step registration to create your PropMind Verified Property Passport
        </p>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>Step {step} of 5</span>
            <span>
              {step === 1 && '1. Property Type'}
              {step === 2 && '2. Location & Address'}
              {step === 3 && '3. Details & Pricing'}
              {step === 4 && '4. Amenities & Documents'}
              {step === 5 && '5. Final Review & Submit'}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: Property Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Select Property Classification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROPERTY_TYPES.map((type) => {
                const isSelected = selectedType === type.value;
                return (
                  <div
                    key={type.value}
                    onClick={() =>
                      setValue('property_type', type.value as PropertyType, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      'p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 select-none',
                      isSelected
                        ? 'border-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-primary-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div
                      className={cn(
                        'p-2.5 rounded-xl shrink-0 transition-colors',
                        isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {propertyIcons[type.value]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{type.label}</h4>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{type.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Location & Address */}
        {step === 2 && (
          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Indore Location & Address</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Complete Address / Colony Name"
                  placeholder="e.g. Flat 402, Royal Palms, Behind C21 Mall"
                  error={errors.address?.message}
                  {...register('address')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Indore Locality <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('locality')}
                >
                  {INDORE_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="PIN Code"
                  placeholder="452010"
                  maxLength={6}
                  error={errors.pincode?.message}
                  {...register('pincode')}
                  required
                />
              </div>

              <div>
                <Input
                  label="City"
                  value="Indore"
                  disabled
                  helperText="Currently serving Indore Real Estate Territory"
                  {...register('city')}
                />
              </div>

              <div>
                <Input
                  label="State"
                  value="Madhya Pradesh"
                  disabled
                  {...register('state')}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Prominent Landmark (Optional)"
                  placeholder="e.g. Near Vijay Nagar Square, 200m from BRTS Stop"
                  {...register('landmark')}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Details & Pricing */}
        {step === 3 && (
          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Property Configuration & Pricing</h3>

            <Input
              label="Listing Title"
              placeholder="e.g. Luxurious 3 BHK Sun-Facing Flat with Covered Parking in Scheme 54"
              error={errors.title?.message}
              {...register('title')}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Highlight floor plan, natural ventilation, builder reputation, nearby schools, hospitals..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Asking Price (in INR ₹)"
                placeholder="e.g. 12500000 for 1.25 Cr"
                leftIcon={<IndianRupee className="w-4 h-4" />}
                error={errors.price?.message}
                {...register('price')}
                required
              />

              <Input
                type="number"
                label="Carpet Area (sq.ft)"
                placeholder="1650"
                error={errors.carpet_area_sqft?.message}
                {...register('carpet_area_sqft')}
                required
              />

              <Input
                type="number"
                label="BHK Configuration"
                placeholder="3"
                {...register('bhk_count')}
              />

              <Input
                type="number"
                label="Bathrooms"
                placeholder="3"
                {...register('bathrooms')}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Furnishing Status
                </label>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('furnishing_status')}
                >
                  <option value="UNFURNISHED">Unfurnished</option>
                  <option value="SEMI_FURNISHED">Semi Furnished</option>
                  <option value="FULLY_FURNISHED">Fully Furnished</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Facing Direction
                </label>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('facing')}
                >
                  <option value="EAST">East (Vastu Preferred)</option>
                  <option value="NORTH">North</option>
                  <option value="NORTH_EAST">North-East</option>
                  <option value="WEST">West</option>
                  <option value="SOUTH">South</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Amenities & Documents */}
        {step === 4 && (
          <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Amenities & Features</h3>
              <p className="text-xs text-slate-500">Select all amenities available at this property</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AMENITIES_LIST.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <div
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={cn(
                      'p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center justify-between select-none',
                      isSelected
                        ? 'border-primary-600 bg-primary-50 text-primary-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span>{amenity}</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center',
                        isSelected ? 'bg-primary-600 text-white' : 'border border-slate-300'
                      )}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Document Upload Area */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Upload Legal Document (For Title & Passport Verification)
              </h4>
              <p className="text-xs text-slate-500">
                Attach registered sale deed, Khasra/Khatoni, tax receipt, or RERA copy to initiate your Property Passport verification case.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={deedType}
                    onChange={(e) => setDeedType(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="SALE_DEED">Registered Sale Deed / Conveyance</option>
                    <option value="KHASRA_KHATONI">MP Bhulekh Khasra / Khatoni</option>
                    <option value="TAX_RECEIPT">IMC Property Tax Receipt / NOC</option>
                    <option value="RERA_REGISTRATION">MP RERA Registration Certificate</option>
                    <option value="ENCUMBRANCE_CERTIFICATE">Encumbrance Certificate (EC)</option>
                  </select>
                </div>
                <Input
                  label="Official Registration / Khasra Reference No."
                  placeholder="e.g. MPIGR-IND-2026-4412"
                  value={deedRef}
                  onChange={(e) => setDeedRef(e.target.value)}
                />
              </div>

              <label className="block border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-primary-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  {deedFile ? `Selected: ${deedFile.name}` : 'Click to attach PDF or Image deed'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  SHA-256 checksum & provenance metadata computed on upload
                </p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => setDeedFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: Final Review & Submit */}
        {step === 5 && (
          <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Review Listing Summary</h3>
                <p className="text-xs text-slate-500">
                  Please confirm all details before submitting for legal audit
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-sm space-y-3">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Property Title</span>
                <span className="font-semibold text-slate-900 text-right max-w-sm truncate">
                  {formValues.title}
                </span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Property Type</span>
                <span className="font-semibold text-slate-900">{formValues.property_type}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-900">
                  {formValues.locality}, {formValues.city}
                </span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Carpet Area</span>
                <span className="font-semibold text-slate-900">
                  {formatArea(formValues.carpet_area_sqft || 0)}
                </span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Asking Price</span>
                <span className="font-bold text-emerald-600 text-base">
                  {formatCurrency(formValues.price || 0)}
                </span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Selected Amenities</span>
                <span className="font-medium text-slate-800">
                  {selectedAmenities.length} selected
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F3EFE6] border border-[#D5CCB9] text-xs text-[#1B3126] space-y-1">
              <p className="font-semibold">PropMind Digital Escrow Guarantee</p>
              <p>
                By submitting this property listing, you confirm ownership or authorized power of attorney to list this property in Indore.
              </p>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)}
            >
              Previous Step
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleNextStep}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Submit & Verify Property
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
