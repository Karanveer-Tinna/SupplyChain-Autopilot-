import React, { useState, useEffect } from 'react';
import { InventoryItem, WorkflowDetails, SupplierItem } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Play,
  RotateCcw,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Truck,
  FileCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { runAutopilotWorkflow, submitDecision, calculateWhatIf, fetchSuppliers } from '../api';

interface Props {
  inventory: InventoryItem[];
  activeWorkflow: WorkflowDetails | null;
  onRefresh: () => void;
  onSelectWorkflow: (wfId: string) => void;
}

export const OperationsTab: React.FC<Props> = ({
  inventory,
  activeWorkflow,
  onRefresh,
  onSelectWorkflow,
}) => {
  const [runningCompId, setRunningCompId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Supplier Catalog state
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [supplierCompFilter, setSupplierCompFilter] = useState<string>('ALL');
  const [showSupplierCatalog, setShowSupplierCatalog] = useState<boolean>(true);

  // Weights state for What-If
  const [wCost, setWCost] = useState(0.45);
  const [wLead, setWLead] = useState(0.35);
  const [wRel, setWRel] = useState(0.20);
  const [whatIfScores, setWhatIfScores] = useState<any[] | null>(null);

  // Decision state
  const [managerComment, setManagerComment] = useState('Approved for operational continuity.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSuppliers = async () => {
    try {
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleFullRefresh = () => {
    onRefresh();
    loadSuppliers();
  };

  const handleRunAutopilot = async (compId: string) => {
    setRunningCompId(compId);
    setActionError(null);
    try {
      const res = await runAutopilotWorkflow(compId, 'HYBRID', {
        w_cost: wCost,
        w_lead_time: wLead,
        w_reliability: wRel,
      });
      handleFullRefresh();
      onSelectWorkflow(res.workflow_id);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setRunningCompId(null);
    }
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!activeWorkflow) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await submitDecision(
        activeWorkflow.workflow_id,
        decision,
        'Jane Doe (Procurement Director)',
        managerComment
      );
      handleFullRefresh();
      onSelectWorkflow(activeWorkflow.workflow_id);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecalculateWhatIf = async () => {
    if (!activeWorkflow) return;
    try {
      const res = await calculateWhatIf(activeWorkflow.workflow_id, {
        w_cost: wCost,
        w_lead_time: wLead,
        w_reliability: wRel,
      });
      setWhatIfScores(res.scores);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Metrics
  const shortagesCount = inventory.filter((i) => i.is_shortage).length;
  const criticalCount = inventory.filter((i) => i.criticality === 'CRITICAL').length;

  // Chart data from active workflow or what-if
  const rawScores =
    whatIfScores ||
    activeWorkflow?.artifacts.find((a) => a.artifact_type === 'RiskDecision')?.payload?.scores ||
    [];

  const chartData = rawScores.map((s: any) => ({
    name: s.supplier_name.split(' ')[0],
    'Acquisition Cost': s.acquisition_cost,
    'Est. Downtime Cost': s.estimated_downtime_cost,
    'Total Cost': s.estimated_total_cost,
    leadTime: s.lead_time_days,
  }));

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-4 bg-red/15 border border-red/40 rounded-xl flex items-center gap-3 text-red shadow-sm">
          <ShieldAlert className="w-5 h-5 text-red shrink-0" />
          <span className="text-sm font-medium">{actionError}</span>
        </div>
      )}

      {/* KPI Cards: Surface0 cards with Surface1 borders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface0 border border-surface1 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-subtext0 uppercase tracking-wider">
            Total Components
          </div>
          <div className="mt-2 text-2xl font-bold text-text">{inventory.length}</div>
          <div className="text-xs text-overlay0 mt-1">Simulated ERP Manufacturing</div>
        </div>

        <div className="p-4 bg-surface0 border border-surface1 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-peach uppercase tracking-wider">
            Shortage Breaches
          </div>
          <div className="mt-2 text-2xl font-bold text-peach">{shortagesCount}</div>
          <div className="text-xs text-subtext0 mt-1">Below safety threshold</div>
        </div>

        <div className="p-4 bg-surface0 border border-surface1 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-red uppercase tracking-wider">
            Critical Components
          </div>
          <div className="mt-2 text-2xl font-bold text-red">{criticalCount}</div>
          <div className="text-xs text-subtext0 mt-1">Downtime risk &gt; ₹10k/day</div>
        </div>

        <div className="p-4 bg-surface0 border border-surface1 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-green uppercase tracking-wider">
            Active Workflow Status
          </div>
          <div className="mt-2 text-xl font-bold text-green">
            {activeWorkflow ? activeWorkflow.status : 'IDLE'}
          </div>
          <div className="text-xs text-subtext0 mt-1 truncate">
            {activeWorkflow ? `ID: ${activeWorkflow.workflow_id}` : 'No active execution'}
          </div>
        </div>
      </div>

      {/* Inventory Monitoring Table */}
      <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-text">
              Component Inventory &amp; Production Buffer Monitor
            </h3>
            <p className="text-xs text-subtext0">
              Live stock readings from ERP Database FastMCP tool (<span className="text-sapphire font-mono">erp-db-mcp</span>)
            </p>
          </div>
          <button
            onClick={handleFullRefresh}
            className="px-3 py-1.5 text-xs bg-surface1 hover:bg-surface2 text-text rounded-lg flex items-center gap-1.5 transition font-medium border border-surface2/60 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sapphire" />
            Refresh Stock
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text">
            <thead className="bg-mantle text-subtext0 uppercase text-[10px] tracking-wider border-b border-surface1">
              <tr>
                <th className="py-2.5 px-3">Component</th>
                <th className="py-2.5 px-3">Available / On-Hand</th>
                <th className="py-2.5 px-3">Safety Stock</th>
                <th className="py-2.5 px-3">Burn Rate</th>
                <th className="py-2.5 px-3">Buffer Days</th>
                <th className="py-2.5 px-3">Criticality</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface1/40">
              {inventory.map((item) => (
                <tr key={item.component_id} className="hover:bg-surface1/30 transition">
                  <td className="py-3 px-3 font-medium text-text">
                    <div>{item.name}</div>
                    <div className="text-[10px] text-overlay0 font-mono">
                      {item.component_id}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-text">{item.available_qty}</span>
                    <span className="text-subtext0"> / {item.on_hand_qty} {item.unit}</span>
                  </td>
                  <td className="py-3 px-3">{item.safety_stock} {item.unit}</td>
                  <td className="py-3 px-3 font-mono text-subtext1">{item.daily_burn_rate} / day</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.buffer_days <= 3
                          ? 'bg-red/20 text-red border border-red/40'
                          : item.buffer_days <= 7
                          ? 'bg-peach/20 text-peach border border-peach/40'
                          : 'bg-green/20 text-green border border-green/40'
                      }`}
                    >
                      {item.buffer_days} days
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.criticality === 'CRITICAL'
                          ? 'bg-red/20 text-red'
                          : item.criticality === 'HIGH'
                          ? 'bg-peach/20 text-peach'
                          : 'bg-surface1 text-subtext1'
                      }`}
                    >
                      {item.criticality}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {item.is_shortage ? (
                      <span className="inline-flex items-center gap-1 text-peach font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Deficit Breach
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Adequate
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleRunAutopilot(item.component_id)}
                      disabled={runningCompId === item.component_id}
                      className="px-3 py-1.5 bg-mauve hover:bg-mauve-light disabled:opacity-50 text-crust font-bold rounded-lg text-xs flex items-center gap-1.5 ml-auto transition shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-crust" />
                      {runningCompId === item.component_id ? 'Running...' : 'Run Autopilot'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Qualified Suppliers Catalog & Database Options */}
      <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sapphire/20 border border-sapphire/40 flex items-center justify-center text-sapphire shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text flex items-center gap-2">
                Qualified Supplier Catalog &amp; Available Options
                <span className="text-[10px] font-mono px-2 py-0.5 bg-mantle border border-surface1 text-sapphire rounded">
                  Table: suppliers_catalog
                </span>
              </h3>
              <p className="text-xs text-subtext0">
                All certified vendors in PostgreSQL with contractual unit pricing, lead times, MOQ, and reliability
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSupplierCatalog(!showSupplierCatalog)}
            className="px-3 py-1.5 text-xs bg-surface1 hover:bg-surface2 text-text rounded-lg flex items-center gap-1.5 transition font-medium border border-surface2/60 shadow-sm"
          >
            {showSupplierCatalog ? <ChevronUp className="w-3.5 h-3.5 text-sapphire" /> : <ChevronDown className="w-3.5 h-3.5 text-sapphire" />}
            {showSupplierCatalog ? 'Hide Suppliers' : 'View Supplier Options'}
          </button>
        </div>

        {showSupplierCatalog && (
          <>
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setSupplierCompFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  supplierCompFilter === 'ALL'
                    ? 'bg-mauve text-crust shadow-md'
                    : 'bg-mantle text-subtext0 hover:text-text border border-surface1'
                }`}
              >
                All Components ({suppliers.length})
              </button>
              {inventory.map((comp) => {
                const count = suppliers.filter((s) => s.component_id === comp.component_id).length;
                return (
                  <button
                    key={comp.component_id}
                    onClick={() => setSupplierCompFilter(comp.component_id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      supplierCompFilter === comp.component_id
                        ? 'bg-mauve text-crust shadow-md'
                        : 'bg-mantle text-subtext0 hover:text-text border border-surface1'
                    }`}
                  >
                    <span>{comp.name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-80 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text">
                <thead className="bg-mantle text-subtext0 uppercase text-[10px] tracking-wider border-b border-surface1">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Name &amp; ID</th>
                    <th className="py-2.5 px-3">Component Target</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Shipping Cost</th>
                    <th className="py-2.5 px-3">Lead Time</th>
                    <th className="py-2.5 px-3">Reliability</th>
                    <th className="py-2.5 px-3">MOQ / Capacity</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface1/40">
                  {suppliers
                    .filter(
                      (s) => supplierCompFilter === 'ALL' || s.component_id === supplierCompFilter
                    )
                    .map((s) => (
                      <tr key={`${s.supplier_id}-${s.component_id}`} className="hover:bg-surface1/30 transition">
                        <td className="py-2.5 px-3 font-medium text-text">
                          <div>{s.supplier_name}</div>
                          <div className="text-[10px] text-overlay0 font-mono">{s.supplier_id}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-sapphire text-[11px]">{s.component_id}</td>
                        <td className="py-2.5 px-3 font-mono text-green font-bold">₹{s.unit_price}</td>
                        <td className="py-2.5 px-3 font-mono text-subtext0">₹{s.shipping_cost}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.lead_time_days <= 3
                                ? 'bg-green/20 text-green border border-green/40'
                                : s.lead_time_days <= 7
                                ? 'bg-peach/20 text-peach border border-peach/40'
                                : 'bg-red/20 text-red border border-red/40'
                            }`}
                          >
                            {s.lead_time_days} days
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-semibold text-subtext1">
                            {(s.reliability_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-subtext0 font-mono text-[11px]">
                          {s.moq} / {s.capacity} units
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-green/20 text-green border border-green/40">
                            <Check className="w-3 h-3 text-green" />
                            Active &amp; Compliant
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Active Procurement Details Section */}
      {activeWorkflow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Supplier Trade-Off Analysis & Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-text">
                    Supplier Trade-off &amp; Downtime Impact
                  </h3>
                  <p className="text-xs text-subtext0">
                    Acquisition cost vs. factory downtime penalty (₹15,000/day)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-subtext0 font-mono">
                    Workflow: {activeWorkflow.workflow_id}
                  </span>
                  <div className="text-xs font-semibold text-sapphire">
                    Selected:{' '}
                    {activeWorkflow.selected_supplier_id || 'Evaluating...'}
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                      <XAxis dataKey="name" stroke="#a6adc8" fontSize={11} />
                      <YAxis stroke="#a6adc8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#181825',
                          borderColor: '#585b70',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                          padding: '10px 14px',
                        }}
                        labelStyle={{ color: '#89b4fa', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}
                        itemStyle={{ color: '#cdd6f4', fontSize: '12px' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                      />
                      <Legend wrapperStyle={{ color: '#bac2de', fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="Acquisition Cost" fill="#89b4fa" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Est. Downtime Cost" fill="#f38ba8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Evaluated Candidate Supplier Options Table */}
              {rawScores.length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface1 overflow-x-auto">
                  <div className="text-xs font-semibold text-text uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Evaluated Supplier Options &amp; Trade-off Breakdown</span>
                    <span className="text-[10px] text-subtext0 font-normal">Ranked by Composite Utility</span>
                  </div>
                  <table className="w-full text-left text-[11px] text-text">
                    <thead className="bg-mantle text-subtext0 uppercase text-[9px] tracking-wider border-b border-surface1">
                      <tr>
                        <th className="py-2 px-2.5">Rank &amp; Supplier</th>
                        <th className="py-2 px-2.5">Lead Time</th>
                        <th className="py-2 px-2.5">Acquisition Cost</th>
                        <th className="py-2 px-2.5">Downtime Risk</th>
                        <th className="py-2 px-2.5">Total Realized Cost</th>
                        <th className="py-2 px-2.5">Score</th>
                        <th className="py-2 px-2.5 text-right">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface1/40">
                      {rawScores.map((s: any) => {
                        const isSelected = s.supplier_id === activeWorkflow.selected_supplier_id;
                        return (
                          <tr
                            key={s.supplier_id}
                            className={
                              isSelected
                                ? 'bg-mauve/15 border-l-2 border-mauve'
                                : 'hover:bg-surface1/30 transition'
                            }
                          >
                            <td className="py-2 px-2.5 font-medium text-text flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  s.rank === 1
                                    ? 'bg-mauve text-crust'
                                    : 'bg-surface1 text-subtext0'
                                }`}
                              >
                                {s.rank}
                              </span>
                              <span>{s.supplier_name}</span>
                            </td>
                            <td className="py-2 px-2.5">{s.lead_time_days} days</td>
                            <td className="py-2 px-2.5 font-mono text-subtext1">
                              ₹{s.acquisition_cost.toLocaleString()}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-red">
                              {s.estimated_downtime_cost > 0
                                ? `₹${s.estimated_downtime_cost.toLocaleString()}`
                                : '₹0 (Safe)'}
                            </td>
                            <td className="py-2 px-2.5 font-mono font-bold text-text">
                              ₹{s.estimated_total_cost.toLocaleString()}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-subtext0">
                              {(s.weighted_score * 100).toFixed(1)}
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              {isSelected ? (
                                <span className="px-2 py-0.5 bg-green/20 text-green border border-green/40 rounded text-[10px] font-bold">
                                  ✓ WINNER
                                </span>
                              ) : s.is_feasible ? (
                                <span className="text-[10px] text-subtext0 font-medium">Alternative</span>
                              ) : (
                                <span className="text-[10px] text-red font-medium">Infeasible</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* What-If Trade-Off Weights */}
              <div className="mt-5 p-4 bg-mantle border border-surface1 rounded-xl">
                <div className="text-xs font-semibold text-text uppercase tracking-wider mb-3">
                  Interactive Policy Weights (What-If Simulation)
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-subtext0 block mb-1">
                      Cost Weight (w₁): {(wCost * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={wCost}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setWCost(val);
                        setWLead(parseFloat(((1 - val) * 0.6).toFixed(2)));
                        setWRel(parseFloat(((1 - val) * 0.4).toFixed(2)));
                      }}
                      className="w-full accent-blue"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-subtext0 block mb-1">
                      Lead Time Weight (w₂): {(wLead * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={wLead}
                      onChange={(e) => setWLead(parseFloat(e.target.value))}
                      className="w-full accent-peach"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-subtext0 block mb-1">
                      Reliability Weight (w₃): {(wRel * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.05"
                      value={wRel}
                      onChange={(e) => setWRel(parseFloat(e.target.value))}
                      className="w-full accent-green"
                    />
                  </div>
                </div>
                <button
                  onClick={handleRecalculateWhatIf}
                  className="mt-3 px-3 py-1.5 bg-surface1 hover:bg-surface2 text-xs text-text rounded-lg font-semibold transition border border-surface2 shadow-sm"
                >
                  Recalculate Ranking
                </button>
              </div>
            </div>

            {/* PO & 3-Way Match Verification Card */}
            {activeWorkflow.order_and_invoice && (
              <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-green" />
                    <h3 className="text-sm font-semibold text-text">
                      Purchase Order &amp; Three-Way Match Verification
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      activeWorkflow.order_and_invoice.match_status === 'MATCHED'
                        ? 'bg-green/20 text-green border border-green/40'
                        : 'bg-red/20 text-red border border-red/40'
                    }`}
                  >
                    {activeWorkflow.order_and_invoice.match_status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs bg-mantle p-3 rounded-lg border border-surface1">
                  <div>
                    <div className="text-subtext0 font-medium">Purchase Order (PO)</div>
                    <div className="text-text font-mono mt-0.5">
                      {activeWorkflow.order_and_invoice.po_id}
                    </div>
                    <div className="text-subtext1 mt-1">
                      Qty: {activeWorkflow.order_and_invoice.po_qty} units @ ₹
                      {activeWorkflow.order_and_invoice.po_unit_price}
                    </div>
                  </div>

                  <div>
                    <div className="text-subtext0 font-medium">Goods Receipt (GRN)</div>
                    <div className="text-text font-mono mt-0.5">
                      {activeWorkflow.order_and_invoice.goods_receipt_ref || 'Pending'}
                    </div>
                    <div className="text-subtext1 mt-1">
                      Received: {activeWorkflow.order_and_invoice.received_qty ?? 'N/A'} units
                    </div>
                  </div>

                  <div>
                    <div className="text-subtext0 font-medium">Vendor Invoice</div>
                    <div className="text-text font-mono mt-0.5">
                      {activeWorkflow.order_and_invoice.invoice_ref || 'Pending'}
                    </div>
                    <div className="text-subtext1 mt-1">
                      Billed: {activeWorkflow.order_and_invoice.invoiced_qty ?? 'N/A'} units @ ₹
                      {activeWorkflow.order_and_invoice.invoiced_unit_price ?? 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Human-in-the-Loop Approval Action Card */}
          <div className="space-y-6">
            <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-peach" />
                <h3 className="text-sm font-semibold text-text">
                  Human-in-the-Loop Governance Gate
                </h3>
              </div>

              <div className="text-xs space-y-2 mb-4">
                <div className="flex justify-between py-1 border-b border-surface1">
                  <span className="text-subtext0">Current State:</span>
                  <span className="font-semibold text-sapphire">{activeWorkflow.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface1">
                  <span className="text-subtext0">Escalation Trigger:</span>
                  <span className="font-medium text-peach text-right max-w-[180px]">
                    {activeWorkflow.escalation_reason || 'Policy check pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface1">
                  <span className="text-subtext0">Estimated Total Cost:</span>
                  <span className="font-semibold text-text font-mono">
                    ₹{activeWorkflow.estimated_total_cost?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>

              {activeWorkflow.status === 'PENDING_HITL' ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-peach/15 border border-peach/40 rounded-lg text-xs text-peach">
                    ⚠️ Order requires authorized manager sign-off before Purchase Order creation.
                  </div>

                  <div>
                    <label className="text-xs text-subtext0 block mb-1">
                      Manager Approval Rationale:
                    </label>
                    <textarea
                      value={managerComment}
                      onChange={(e) => setManagerComment(e.target.value)}
                      rows={2}
                      className="w-full text-xs bg-mantle border border-surface1 rounded-lg p-2 text-text focus:outline-none focus:border-mauve"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDecision('APPROVED')}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-green hover:bg-green-light text-crust rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <ThumbsUp className="w-4 h-4 fill-crust" />
                      Approve Order
                    </button>
                    <button
                      onClick={() => handleDecision('REJECTED')}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-red hover:bg-red-light text-crust rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <ThumbsDown className="w-4 h-4 fill-crust" />
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-mantle border border-surface1 rounded-lg text-xs text-subtext0">
                  {activeWorkflow.status === 'COMPLETED'
                    ? '✓ Workflow completed successfully. Purchase order issued and reconciled.'
                    : activeWorkflow.status === 'REJECTED'
                    ? '✗ Workflow rejected by manager. No purchase order was created.'
                    : 'Workflow is currently executing specialized agent tasks.'}
                </div>
              )}
            </div>

            {/* Quick Summary of Executive Report */}
            {activeWorkflow.final_report_md && (
              <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg max-h-80 overflow-y-auto">
                <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-2">
                  Generated Executive Report
                </h4>
                <pre className="text-[11px] text-subtext0 font-mono whitespace-pre-wrap bg-mantle p-3 rounded-lg border border-surface1">
                  {activeWorkflow.final_report_md}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
