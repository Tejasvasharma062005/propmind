import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Handshake,
  IndianRupee,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { platformService, type TransactionRecord } from '@/services/platform.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getErrorMessage } from '@/components/listings';
import { formatCurrency, formatDate } from '@/lib/utils';

const MILESTONE_ORDER: TransactionRecord['status'][] = [
  'TOKEN_PENDING',
  'TOKEN_PAID',
  'AGREEMENT_DRAFTED',
  'ADVANCE_PAID',
  'REGISTRATION_SCHEDULED',
  'COMPLETED',
];

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: negotiations = [], isLoading: loadingNeg } = useQuery({
    queryKey: ['negotiations'],
    queryFn: () => platformService.getNegotiations(),
  });

  const { data: transactions = [], isLoading: loadingTxn } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => platformService.getTransactions(),
  });

  const [counterSessionId, setCounterSessionId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterTerms, setCounterTerms] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['negotiations'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const counterMutation = useMutation({
    mutationFn: ({ id, amount, terms }: { id: string; amount: string; terms: string }) =>
      platformService.counterOffer(id, { amount, terms }),
    onSuccess: () => {
      setCounterSessionId(null);
      setCounterAmount('');
      setCounterTerms('');
      invalidateAll();
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'accept' | 'reject' }) =>
      platformService.respondOffer(id, decision),
    onSuccess: invalidateAll,
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const milestoneMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action:
        | 'PAY_TOKEN'
        | 'DRAFT_AGREEMENT'
        | 'PAY_ADVANCE'
        | 'SCHEDULE_REGISTRY'
        | 'COMPLETE_REGISTRY';
    }) => platformService.advanceTransactionMilestone(id, action),
    onSuccess: invalidateAll,
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  if (loadingNeg || loadingTxn) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1C2420]">Deal Room, Negotiations & Escrow</h1>
        <p className="text-sm text-[#5A625D] mt-0.5">
          Manage purchase offers, counter-offers, institutional escrow payments, and conveyance milestones
        </p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {/* 1. Active & Historical Negotiations */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Handshake className="w-5 h-5 text-primary-600" />
          Offers & Negotiations ({negotiations.length})
        </h2>

        {negotiations.length === 0 ? (
          <Card className="p-6 text-sm text-slate-500">
            No active purchase offers yet. Buyers can submit an offer from any property detail page.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {negotiations.map((session) => {
              const latestOffer = session.offers?.[0];
              const canAcceptOrReject =
                session.status === 'ACTIVE' &&
                latestOffer &&
                (latestOffer.offered_by !== user?.id || user?.is_staff);

              return (
                <Card key={session.id} className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {session.property_title} ({session.property_locality})
                        </h3>
                        <Badge
                          variant={
                            session.status === 'ACCEPTED'
                              ? 'success'
                              : session.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {session.status_display || session.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Buyer: <strong>{session.buyer_name}</strong> • Seller:{' '}
                        <strong>{session.seller_name}</strong> • Listed Price:{' '}
                        {formatCurrency(Number(session.property_price))}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Current Offer</span>
                      <span className="text-xl font-black text-primary-700">
                        {formatCurrency(Number(session.current_offer_amount))}
                      </span>
                    </div>
                  </div>

                  {session.offers.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs">
                      <p className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                        Offer History
                      </p>
                      {session.offers.map((o) => (
                        <div
                          key={o.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 last:border-none pb-1.5 last:pb-0"
                        >
                          <span>
                            <strong>{o.offered_by_name}</strong> offered{' '}
                            <strong className="text-slate-900">
                              {formatCurrency(Number(o.amount))}
                            </strong>
                            {o.terms ? ` — "${o.terms}"` : ''}
                          </span>
                          <span className="text-slate-400">
                            {o.status} • {formatDate(o.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {session.status === 'ACTIVE' && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<IndianRupee className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setCounterSessionId(session.id);
                          setCounterAmount(String(session.current_offer_amount));
                        }}
                      >
                        Counter-Offer
                      </Button>
                      {canAcceptOrReject && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() =>
                              respondMutation.mutate({ id: session.id, decision: 'accept' })
                            }
                            isLoading={respondMutation.isPending}
                          >
                            Accept & Open Escrow
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() =>
                              respondMutation.mutate({ id: session.id, decision: 'reject' })
                            }
                            isLoading={respondMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Escrow Transactions & Conveyance Milestones */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          Escrow Conveyance Transactions ({transactions.length})
        </h2>

        {transactions.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No escrow transactions yet"
            description="When a purchase offer is accepted, an institutional escrow deal room is automatically created here."
          />
        ) : (
          <div className="space-y-6">
            {transactions.map((txn) => {
              const currentIdx = MILESTONE_ORDER.indexOf(txn.status);
              const totalPaid = (txn.payments || []).reduce(
                (acc, p) => acc + Number(p.amount || 0),
                0
              );

              return (
                <Card key={txn.id} className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {txn.property_title} ({txn.property_locality})
                        </h3>
                        <Badge
                          variant={txn.status === 'COMPLETED' ? 'success' : 'primary'}
                          size="sm"
                        >
                          {txn.status_display || txn.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Escrow ID: <span className="font-mono">{txn.id.slice(0, 8).toUpperCase()}</span>{' '}
                        • Buyer: <strong>{txn.buyer_name}</strong> • Seller:{' '}
                        <strong>{txn.seller_name}</strong> • Agreed Price:{' '}
                        <strong>{formatCurrency(Number(txn.final_sale_price))}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Funds Deposited in Escrow</span>
                      <span className="text-xl font-black text-emerald-600">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>
                  </div>

                  {/* 5 Conveyance Milestones */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Conveyance & Escrow Milestones
                    </h4>

                    {[
                      {
                        stepIdx: 1,
                        title: 'Milestone 1: Token (Bayana) Deposit (10%)',
                        desc: `Token amount of ${formatCurrency(Number(txn.token_amount))} credited into PropMind Escrow`,
                        action: 'PAY_TOKEN' as const,
                        btnLabel: 'Deposit 10% Token in Escrow',
                      },
                      {
                        stepIdx: 2,
                        title: 'Milestone 2: Agreement to Sell (Bayana Deed) Execution',
                        desc: 'Legal Agreement to Sell drafted and digitally signed by buyer & seller',
                        action: 'DRAFT_AGREEMENT' as const,
                        btnLabel: 'Execute Agreement to Sell',
                      },
                      {
                        stepIdx: 3,
                        title: 'Milestone 3: Advance Consideration Installment (20%)',
                        desc: 'Second tranche payment funded into escrow prior to registry slot booking',
                        action: 'PAY_ADVANCE' as const,
                        btnLabel: 'Pay 20% Advance Installment',
                      },
                      {
                        stepIdx: 4,
                        title: 'Milestone 4: Sub-Registrar Indore Slot Booking',
                        desc: txn.registration_date
                          ? `Registry scheduled for ${formatDate(txn.registration_date)}`
                          : 'Book physical conveyance appointment at Sub-Registrar Indore',
                        action: 'SCHEDULE_REGISTRY' as const,
                        btnLabel: 'Schedule Registry Date',
                      },
                      {
                        stepIdx: 5,
                        title: 'Milestone 5: Final Registry Execution & Escrow Release',
                        desc: 'Sale deed registered, balance settled, and escrow released to seller',
                        action: 'COMPLETE_REGISTRY' as const,
                        btnLabel: 'Complete Registry & Release Escrow',
                      },
                    ].map((m) => {
                      const isDone = currentIdx >= m.stepIdx;
                      const isCurrent = currentIdx === m.stepIdx - 1;
                      return (
                        <div
                          key={m.title}
                          className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border text-sm ${
                            isDone
                              ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200'
                              : isCurrent
                              ? 'bg-primary-50/80 text-primary-900 border-primary-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200 opacity-75'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : isCurrent ? (
                              <Clock className="w-5 h-5 text-primary-600 shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold block">{m.title}</span>
                              <p className="text-xs opacity-80">{m.desc}</p>
                            </div>
                          </div>

                          <div>
                            {isDone ? (
                              <span className="text-xs font-bold text-emerald-700">COMPLETED</span>
                            ) : isCurrent ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() =>
                                  milestoneMutation.mutate({ id: txn.id, action: m.action })
                                }
                                isLoading={milestoneMutation.isPending}
                              >
                                {m.btnLabel}
                              </Button>
                            ) : (
                              <span className="text-xs font-semibold">PENDING</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Executed Deeds, Checklist Tasks & Payment Ledger */}
                  {txn.tasks && txn.tasks.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Transaction Room Stakeholder Checklist ({txn.tasks.filter((t) => t.status === 'COMPLETED').length}/{txn.tasks.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {txn.tasks.map((t) => (
                          <div
                            key={t.id}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                              t.status === 'COMPLETED'
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-medium">
                              #{t.order_index} {t.title} ({t.assigned_role_display || t.assigned_role})
                            </span>
                            <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                              {t.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(txn.deeds?.length > 0 || txn.payments?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <p className="font-semibold text-slate-600 mb-2">Escrow Payment Ledger</p>
                        {txn.payments.map((p) => (
                          <div
                            key={p.id}
                            className="flex justify-between py-1 border-b border-slate-100 last:border-none"
                          >
                            <span>
                              {p.purpose.replace('_', ' ')} ({p.gateway_payment_id})
                            </span>
                            <strong className="text-emerald-700">
                              {formatCurrency(Number(p.amount))}
                            </strong>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-600 mb-2">Executed Legal Deeds</p>
                        {txn.deeds.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary-600" />
                              {d.deed_type.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="success" size="sm">
                              Signed
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        isOpen={Boolean(counterSessionId)}
        onClose={() => setCounterSessionId(null)}
        title="Submit Counter-Offer"
        description="Propose a revised price and payment terms."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (counterSessionId && counterAmount) {
              counterMutation.mutate({
                id: counterSessionId,
                amount: counterAmount,
                terms: counterTerms,
              });
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Counter-Offer Amount (₹)"
            type="number"
            min={1}
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            required
          />
          <Input
            label="Terms & Conditions (Optional)"
            placeholder="e.g. 10% token immediately, registry within 45 days"
            value={counterTerms}
            onChange={(e) => setCounterTerms(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCounterSessionId(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={counterMutation.isPending}>
              Send Counter-Offer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
