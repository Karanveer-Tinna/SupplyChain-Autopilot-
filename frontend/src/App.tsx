import React, { useState, useEffect } from 'react';
import { InventoryItem, WorkflowDetails, BenchmarkSummary } from './types';
import { fetchInventory, fetchWorkflowDetails, fetchBenchmarkSummary, fetchRecentWorkflows } from './api';
import { OperationsTab } from './components/OperationsTab';
import { ObservatoryTab } from './components/ObservatoryTab';
import { ExperimentsTab } from './components/ExperimentsTab';
import { Layers, Activity, Cpu, PlayCircle, BarChart3, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'operations' | 'observatory' | 'experiments'>('operations');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDetails | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkSummary | null>(null);
  const [recentWorkflows, setRecentWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [inv, wfs, bench] = await Promise.all([
        fetchInventory(),
        fetchRecentWorkflows(),
        fetchBenchmarkSummary(),
      ]);
      setInventory(inv);
      setRecentWorkflows(wfs);
      setBenchmarkData(bench);

      // Auto-select latest workflow if none selected or if active
      if (wfs.length > 0 && !activeWorkflow) {
        const latest = await fetchWorkflowDetails(wfs[0].workflow_id);
        setActiveWorkflow(latest);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkflow = async (wfId: string) => {
    try {
      const details = await fetchWorkflowDetails(wfId);
      setActiveWorkflow(details);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-base text-text flex flex-col font-sans selection:bg-mauve selection:text-crust">
      {/* Top Navigation Bar: Crust background with Surface0 border */}
      <header className="bg-crust border-b border-surface0 px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-mauve/20 border border-mauve/40 flex items-center justify-center text-mauve shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-text flex items-center gap-2">
                SupplyChain Autopilot
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-mantle border border-mauve/40 text-mauve rounded">
                  v1.0 Baseline
                </span>
              </div>
              <div className="text-xs text-subtext0">
                Google ADK + CrewAI &bull; A2A Protocol &bull; FastMCP Tools &bull; PostgreSQL Blackboard
              </div>
            </div>
          </div>

          {/* Tab Selector: Mantle container with Surface0 border */}
          <div className="flex bg-mantle p-1 rounded-xl border border-surface0 shadow-inner">
            <button
              onClick={() => setActiveTab('operations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'operations'
                  ? 'bg-mauve text-crust font-bold shadow-md'
                  : 'text-subtext0 hover:text-text hover:bg-surface0/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              1. Operations &amp; Approval
            </button>
            <button
              onClick={() => setActiveTab('observatory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'observatory'
                  ? 'bg-mauve text-crust font-bold shadow-md'
                  : 'text-subtext0 hover:text-text hover:bg-surface0/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              2. Agent Observatory &amp; Blackboard
            </button>
            <button
              onClick={() => setActiveTab('experiments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'experiments'
                  ? 'bg-mauve text-crust font-bold shadow-md'
                  : 'text-subtext0 hover:text-text hover:bg-surface0/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              3. Architecture &amp; Experiments
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body: Base canvas */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-subtext0">
            Connecting to backend and FastMCP servers...
          </div>
        ) : (
          <>
            {activeTab === 'operations' && (
              <OperationsTab
                inventory={inventory}
                activeWorkflow={activeWorkflow}
                onRefresh={loadData}
                onSelectWorkflow={handleSelectWorkflow}
              />
            )}
            {activeTab === 'observatory' && (
              <ObservatoryTab activeWorkflow={activeWorkflow} />
            )}
            {activeTab === 'experiments' && (
              <ExperimentsTab benchmarkData={benchmarkData} onRefresh={loadData} />
            )}
          </>
        )}
      </main>

      {/* Footer: Crust background with Surface0 border */}
      <footer className="border-t border-surface0 bg-crust px-6 py-3 text-center text-xs text-overlay0">
        SupplyChain Autopilot &bull; Multi-Agent Procurement &bull; Google ADK &amp; CrewAI Interoperability
      </footer>
    </div>
  );
};
