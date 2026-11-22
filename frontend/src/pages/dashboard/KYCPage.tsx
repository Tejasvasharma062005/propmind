import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, ShieldCheck, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { userService } from '@/services/user.service';
import { platformService } from '@/services/platform.service';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/components/listings';
import { formatDate } from '@/lib/utils';

export const KYCPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = hasRole(['ADMIN']) || Boolean(user?.is_staff);

  const { data: kycResponse, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => userService.getKYCStatus(),
  });

  const { data: kycQueue = [] } = useQuery({
    queryKey: ['admin-kyc-queue'],
    queryFn: () => platformService.getAdminKYCQueue(),
    enabled: isAdmin,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => platformService.getAdminAuditLogs(),
    enabled: isAdmin,
  });

  const [docType, setDocType] = useState<'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID'>('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!frontFile || !selfieFile) {
        throw new Error('Please attach both the front ID document image and a live selfie image.');
      }
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('document_number', docNumber.trim());
      formData.append('front_image', frontFile);
      if (backFile) formData.append('back_image', backFile);
      formData.append('selfie_image', selfieFile);
      return await userService.submitKYC(formData);
    },
    onSuccess: () => {
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['admin-kyc-queue'] });
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      }
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) =>
      platformService.reviewKYC(
        id,
        decision,
        decision === 'reject' ? 'Document illegible or mismatched; please re-upload.' : ''
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  const kycRecord = kycResponse?.data;
  const kycStatus = kycRecord?.status || 'NOT_SUBMITTED';
  const isUnderReview = submitMutation.isSuccess || kycStatus === 'UNDER_REVIEW' || kycStatus === 'PENDING';
  const isApproved = kycStatus === 'APPROVED';

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1C2420]">Identity, KYC & Compliance Governance</h1>
        <p className="text-sm text-[#5A625D] mt-0.5">
          Government ID verification, compliance review queue, and immutable platform audit logs
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Current KYC Status</h3>
                <p className="text-xs text-slate-500">
                  {kycRecord?.document_type
                    ? `Submitted Document: ${kycRecord.document_type}`
                    : 'Tier 1 Identity Verification'}
                </p>
              </div>
            </div>
            <Badge
              variant={
                kycStatus === 'APPROVED'
                  ? 'success'
                  : kycStatus === 'REJECTED'
                  ? 'danger'
                  : 'warning'
              }
              size="md"
            >
              {kycStatus}
            </Badge>
          </div>

          {isUnderReview ? (
            <div className="p-4 rounded-xl bg-[#F3EBD8] border border-[#D8C9A7] text-[#373124] text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#494431] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">KYC Documents Under Compliance Review</p>
                <p className="text-xs text-[#494431] mt-0.5">
                  Your identity documents have been SHA-256 hashed and stored securely. They are currently in the <strong>Admin KYC Compliance Queue</strong> for manual verification by a PropMind administrator.
                </p>
              </div>
            </div>
          ) : null}

          {kycStatus === 'REJECTED' && kycRecord?.rejection_reason && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <p className="font-bold">Action Required — Previous Submission Rejected</p>
              <p className="text-xs mt-0.5">{kycRecord.rejection_reason}</p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select ID Document Type
              </label>
              <select
                value={docType}
                onChange={(e) =>
                  setDocType(e.target.value as 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID')
                }
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="AADHAAR">Aadhaar Card (12-digit UIDAI)</option>
                <option value="PAN">PAN Card (Income Tax Dept)</option>
                <option value="PASSPORT">Indian Passport</option>
                <option value="VOTER_ID">Voter ID (Election Commission)</option>
              </select>
            </div>

            <Input
              label="Document Identification Number"
              placeholder={docType === 'AADHAAR' ? '12-digit Aadhaar number' : 'ABCDE1234F'}
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Front Image (Required)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Back Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Selfie Image (Required)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isUnderReview || isApproved}
              isLoading={submitMutation.isPending}
            >
              {isUnderReview
                ? 'Application under review'
                : isApproved
                ? 'KYC Verified'
                : kycStatus === 'REJECTED'
                ? 'Resubmit KYC for Verification'
                : 'Submit KYC for Verification'}
            </Button>
          </form>
        </Card>
      )}

      {/* Admin KYC Compliance Queue & Immutable Audit Trail */}
      {isAdmin && (
        <>
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Admin KYC Compliance Queue ({kycQueue.length})
            </h2>
            {kycQueue.length === 0 ? (
              <p className="text-xs text-slate-500">No KYC submissions in queue.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {kycQueue.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.user_name}</span> (
                      {item.user_email}) • <strong>{item.document_type}</strong> •{' '}
                      <Badge
                        variant={
                          item.status === 'APPROVED'
                            ? 'success'
                            : item.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    {item.status !== 'APPROVED' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => reviewMutation.mutate({ id: item.id, decision: 'approve' })}
                          isLoading={reviewMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => reviewMutation.mutate({ id: item.id, decision: 'reject' })}
                          isLoading={reviewMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Immutable Platform Security & Audit Trail ({auditLogs.length} Recent Events)
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No audit log events recorded yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase">
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Actor</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Target Entity</th>
                      <th className="pb-2">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.slice(0, 30).map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 text-slate-500">{formatDate(log.created_at)}</td>
                        <td className="py-2 font-medium text-slate-800">{log.actor_email || 'SYSTEM'}</td>
                        <td className="py-2 font-mono text-primary-700 font-semibold">{log.action}</td>
                        <td className="py-2 font-mono text-slate-600">
                          {log.target_type}:{log.target_id.slice(0, 8)}
                        </td>
                        <td className="py-2 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
