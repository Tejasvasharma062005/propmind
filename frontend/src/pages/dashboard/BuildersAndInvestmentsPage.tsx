import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, HardHat, IndianRupee, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { platformService } from '@/services/platform.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/components/listings';
import { formatCurrency } from '@/lib/utils';

export const BuildersAndInvestmentsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isBuilderOrAdmin = hasRole(['BUILDER', 'ADMIN']);

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['builder-projects'],
    queryFn: () => platformService.getBuilderProjects(),
  });

  const { data: pools = [], isLoading: loadingPools } = useQuery({
    queryKey: ['investment-pools'],
    queryFn: () => platformService.getInvestmentPools(),
  });

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projLocality, setProjLocality] = useState('Super Corridor');
  const [projRera, setProjRera] = useState('');
  const [projUnits, setProjUnits] = useState('60');

  const [contributePoolId, setContributePoolId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('250000');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createProjectMutation = useMutation({
    mutationFn: () =>
      platformService.createBuilderProject({
        name: projName,
        locality: projLocality,
        rera_registration_number: projRera,
        total_units: Number(projUnits) || 60,
        available_units: Number(projUnits) || 60,
        status: 'UNDER_CONSTRUCTION',
      }),
    onSuccess: () => {
      setProjectModalOpen(false);
      setProjName('');
      setProjRera('');
      queryClient.invalidateQueries({ queryKey: ['builder-projects'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  const contributeMutation = useMutation({
    mutationFn: () => platformService.contributeToPool(contributePoolId!, contributeAmount),
    onSuccess: () => {
      setContributePoolId(null);
      queryClient.invalidateQueries({ queryKey: ['investment-pools'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  if (loadingProjects || loadingPools) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2420]">
            Builder RERA Projects & Investment Pools
          </h1>
          <p className="text-sm text-[#5A625D] mt-0.5">
            RERA-registered developer inventory and fractional commercial/land yield pools in Indore
          </p>
        </div>
        {isBuilderOrAdmin && (
          <Button
            onClick={() => setProjectModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register RERA Project
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* 1. Builder Projects & Unit Inventory */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <HardHat className="w-5 h-5 text-primary-600" />
          RERA Developer Projects & Unit Inventory ({projects.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {projects.map((proj) => (
            <Card key={proj.id} className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {proj.name} ({proj.locality}, {proj.city})
                    </h3>
                    <Badge variant="primary" size="sm">
                      RERA: {proj.rera_registration_number}
                    </Badge>
                    <Badge variant="success" size="sm">
                      {proj.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Developer: <strong>{proj.builder_name}</strong> • Total Units:{' '}
                    {proj.total_units} • Available: {proj.available_units}
                  </p>
                </div>
              </div>

              {proj.units && proj.units.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase">
                        <th className="pb-2">Tower / Unit</th>
                        <th className="pb-2">Configuration</th>
                        <th className="pb-2">Carpet Area</th>
                        <th className="pb-2">Base Price</th>
                        <th className="pb-2">Availability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {proj.units.map((u) => (
                        <tr key={u.id}>
                          <td className="py-2 font-semibold text-slate-800">
                            {u.tower_or_block} — {u.unit_number}
                          </td>
                          <td className="py-2">{u.configuration}</td>
                          <td className="py-2">{Number(u.carpet_area_sqft).toLocaleString('en-IN')} sq.ft</td>
                          <td className="py-2 font-semibold">{formatCurrency(Number(u.base_price))}</td>
                          <td className="py-2">
                            <Badge variant={u.status === 'AVAILABLE' ? 'success' : 'warning'} size="sm">
                              {u.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Fractional Real Estate Investment Pools */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Fractional Investment Pools ({pools.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map((pool) => {
            const pct = Math.min(
              Math.round((Number(pool.raised_amount) / Math.max(Number(pool.target_amount), 1)) * 100),
              100
            );
            return (
              <Card key={pool.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{pool.title}</h3>
                    <p className="text-xs text-slate-500">
                      Asset: {pool.property_title} ({pool.property_locality})
                    </p>
                  </div>
                  <Badge variant={pool.status === 'OPEN' ? 'success' : 'primary'} size="sm">
                    {pool.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Target</span>
                    <strong className="text-slate-800">
                      {formatCurrency(Number(pool.target_amount))}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Min Ticket</span>
                    <strong className="text-slate-800">
                      {formatCurrency(Number(pool.minimum_investment))}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Target IRR</span>
                    <strong className="text-emerald-600">{pool.expected_roi_percentage}% p.a.</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">
                      Raised: {formatCurrency(Number(pool.raised_amount))}
                    </span>
                    <span className="font-bold text-primary-700">{pct}% Funded</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {pool.status === 'OPEN' && (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    leftIcon={<IndianRupee className="w-4 h-4" />}
                    onClick={() => {
                      setContributePoolId(pool.id);
                      setContributeAmount(String(pool.minimum_investment));
                    }}
                  >
                    Invest in Pool
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="Register RERA Builder Project"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProjectMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Project Name"
            placeholder="e.g. Emerald Heights Township"
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            required
          />
          <Input
            label="Indore Locality"
            value={projLocality}
            onChange={(e) => setProjLocality(e.target.value)}
            required
          />
          <Input
            label="MP RERA Registration Number"
            placeholder="e.g. P-IND-26-14021"
            value={projRera}
            onChange={(e) => setProjRera(e.target.value)}
            required
          />
          <Input
            label="Total Inventory Units"
            type="number"
            min={1}
            value={projUnits}
            onChange={(e) => setProjUnits(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createProjectMutation.isPending}>
              Register Project
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(contributePoolId)}
        onClose={() => setContributePoolId(null)}
        title="Commit Fractional Investment"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            contributeMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Investment Amount (₹)"
            type="number"
            min={1}
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setContributePoolId(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={contributeMutation.isPending}>
              Confirm Commitment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BuildersAndInvestmentsPage;
