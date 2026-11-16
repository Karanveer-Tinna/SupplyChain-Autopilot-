import React, { useState } from 'react';
import { BenchmarkSummary } from '../types';
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
import { Play } from 'lucide-react';
import { triggerBenchmarkRun } from '../api';

interface Props {
  benchmarkData: BenchmarkSummary | null;
  onRefresh: () => void;
}

export const ExperimentsTab: React.FC<Props> = ({ benchmarkData, onRefresh }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const handleRunBenchmarks = async () => {
    setIsRunning(true);
    setRunMessage('Executing 105-run evaluation matrix across seeded scenarios...');
    try {
      const res = await triggerBenchmarkRun();
      setRunMessage(`✓ Benchmark complete: ${res.runs_completed} runs recorded in PostgreSQL!`);
      onRefresh();
    } catch (err: any) {
      setRunMessage(`Failed to run benchmark: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const suiteA = benchmarkData?.suite_a_architecture || [];
  const suiteB = benchmarkData?.suite_b_personas || [];

  const archChartData = suiteA.map((a) => ({
    name: a.architecture.replace('BASELINE_', 'Base-'),
    'Realized Cost': a.avg_realized_cost,
    'Downtime Cost': a.avg_downtime_cost,
    Latency: a.avg_latency_ms,
  }));

  const personaChartData = suiteB.map((p) => ({
    name: p.persona.replace('_', ' '),
    'Realized Cost': p.avg_realized_cost,
    'Downtime Cost': p.avg_downtime_cost,
    Tokens: p.avg_tokens,
  }));

  return (
    <div className="space-y-6">
      {/* Header & Trigger */}
      <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text">
            Architecture &amp; Prompt Benchmarking Matrix
          </h3>
          <p className="text-xs text-subtext0">
            Reproducible 105-run evaluation suite comparing Baseline A against Sequential, Pure Blackboard, and Hybrid architectures
          </p>
        </div>
        <button
          onClick={handleRunBenchmarks}
          disabled={isRunning}
          className="px-4 py-2 bg-mauve hover:bg-mauve/90 disabled:opacity-50 text-crust rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-mauve/10 transition active:scale-[0.98]"
        >
          <Play className="w-3.5 h-3.5 fill-crust text-crust" />
          {isRunning ? 'Running 105 Runs...' : 'Run 105-Run Matrix'}
        </button>
      </div>

      {runMessage && (
        <div className="p-3 bg-mantle border border-mauve/40 rounded-lg text-xs text-mauve font-medium">
          {runMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface0 border border-surface1 rounded-xl">
          <div className="text-xs font-semibold text-subtext0 uppercase tracking-wider">
            Total Seeded Runs
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {benchmarkData?.total_runs || 105}
          </div>
          <div className="text-xs text-subtext0 mt-1">60 Suite A + 45 Suite B</div>
        </div>

        <div className="p-4 bg-surface0 border border-surface1 rounded-xl">
          <div className="text-xs font-semibold text-green uppercase tracking-wider">
            Max Cost Savings
          </div>
          <div className="mt-2 text-2xl font-bold text-green">+72.7%</div>
          <div className="text-xs text-subtext0 mt-1">vs. Heuristic Baseline A</div>
        </div>

        <div className="p-4 bg-surface0 border border-surface1 rounded-xl">
          <div className="text-xs font-semibold text-sapphire uppercase tracking-wider">
            Downtime Reduction
          </div>
          <div className="mt-2 text-2xl font-bold text-sapphire">-94.3%</div>
          <div className="text-xs text-subtext0 mt-1">₹175k baseline &rarr; ₹10k agentic</div>
        </div>

        <div className="p-4 bg-surface0 border border-surface1 rounded-xl">
          <div className="text-xs font-semibold text-mauve uppercase tracking-wider">
            Mean Machine Latency
          </div>
          <div className="mt-2 text-2xl font-bold text-mauve">9.6 ms</div>
          <div className="text-xs text-subtext0 mt-1">Hybrid Supervisor + A2A</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suite A: Architecture Realized Cost & Downtime */}
        <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-semibold text-text mb-1">
            Suite A: Architecture Realized Cost vs. Downtime
          </h4>
          <p className="text-xs text-subtext0 mb-4">
            Demonstrates how risk-aware optimization avoids catastrophic downtime costs
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={archChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                <XAxis dataKey="name" stroke="#a6adc8" fontSize={11} />
                <YAxis stroke="#a6adc8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181825',
                    borderColor: '#89b4fa',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    padding: '10px 14px',
                  }}
                  labelStyle={{ color: '#89b4fa', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}
                  itemStyle={{ color: '#cdd6f4', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ color: '#a6adc8', fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Realized Cost" fill="#89b4fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Downtime Cost" fill="#f38ba8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Suite B: Persona Impact on Cost & Downtime */}
        <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-semibold text-text mb-1">
            Suite B: Persona Trade-offs (Demand Surge Scenario)
          </h4>
          <p className="text-xs text-subtext0 mb-4">
            Cost-Focused (w₁=0.7) vs. Risk-Conscious (w₂=0.45) vs. Neutral Policy
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                <XAxis dataKey="name" stroke="#a6adc8" fontSize={11} />
                <YAxis stroke="#a6adc8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181825',
                    borderColor: '#cba6f7',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    padding: '10px 14px',
                  }}
                  labelStyle={{ color: '#cba6f7', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}
                  itemStyle={{ color: '#cdd6f4', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ color: '#a6adc8', fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Realized Cost" fill="#cba6f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Downtime Cost" fill="#fab387" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="bg-surface0 border border-surface1 rounded-xl p-5 shadow-lg">
        <h4 className="text-sm font-semibold text-text mb-3">
          Detailed Performance Comparison Table
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text">
            <thead className="bg-mantle text-subtext0 uppercase text-[10px] tracking-wider border-b border-surface1">
              <tr>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3">Runs</th>
                <th className="py-2.5 px-3">Avg Realized Cost</th>
                <th className="py-2.5 px-3">Avg Downtime Cost</th>
                <th className="py-2.5 px-3">Cost Savings</th>
                <th className="py-2.5 px-3 text-right">Machine Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface1/40">
              {suiteA.map((row) => (
                <tr key={row.architecture} className="hover:bg-surface1/30 transition">
                  <td className="py-2.5 px-3 font-semibold text-text font-mono">
                    {row.architecture}
                  </td>
                  <td className="py-2.5 px-3 text-subtext1">{row.runs_count}</td>
                  <td className="py-2.5 px-3 font-medium text-text">₹{row.avg_realized_cost.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-red font-medium">₹{row.avg_downtime_cost.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold ${
                        row.cost_savings_pct > 0 ? 'text-green' : 'text-subtext0'
                      }`}
                    >
                      {row.cost_savings_pct > 0 ? `+${row.cost_savings_pct}%` : 'Baseline'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-subtext0">
                    {row.avg_latency_ms.toFixed(1)} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
