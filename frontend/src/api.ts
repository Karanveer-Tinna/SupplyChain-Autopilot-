import { InventoryItem, WorkflowDetails, BenchmarkSummary, SupplierItem } from './types';

function resolveBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!envUrl || envUrl === '/api') return '/api';
  let formatted = envUrl;
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://') && !formatted.startsWith('/')) {
    formatted = `https://${formatted}`;
  }
  formatted = formatted.replace(/\/+$/, '');
  if (!formatted.endsWith('/api') && !formatted.includes('/api/')) {
    formatted = `${formatted}/api`;
  }
  return formatted;
}

const BASE_URL = resolveBaseUrl();

export async function fetchInventory(): Promise<InventoryItem[]> {
  const res = await fetch(`${BASE_URL}/inventory`);
  if (!res.ok) throw new Error('Failed to load inventory');
  return res.json();
}

export async function fetchSuppliers(componentId?: string): Promise<SupplierItem[]> {
  const url = componentId ? `${BASE_URL}/suppliers?component_id=${componentId}` : `${BASE_URL}/suppliers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load suppliers');
  return res.json();
}

export async function runAutopilotWorkflow(
  componentId: string,
  architecture: string = 'HYBRID',
  weights?: { w_cost: number; w_lead_time: number; w_reliability: number }
): Promise<any> {
  const res = await fetch(`${BASE_URL}/workflows/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      component_id: componentId,
      architecture,
      ...weights,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Workflow execution failed');
  }
  return res.json();
}

export async function fetchWorkflowDetails(workflowId: string): Promise<WorkflowDetails> {
  const res = await fetch(`${BASE_URL}/workflows/${workflowId}`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export async function fetchRecentWorkflows(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/workflows`);
  if (!res.ok) throw new Error('Failed to fetch workflows');
  return res.json();
}

export async function submitHitlDecision(workflowId: string, decision: 'APPROVE' | 'REJECT'): Promise<any> {
  const res = await fetch(`${BASE_URL}/workflows/hitl-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow_id: workflowId,
      decision,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit HITL decision');
  }
  return res.json();
}

export async function simulateWhatIf(
  unitPrice: number,
  leadTimeDays: number,
  weights: { w_cost: number; w_lead_time: number; w_reliability: number },
  downtimeCostPerDay: number = 25000,
  supplierReliability: number = 0.95
): Promise<any> {
  const res = await fetch(`${BASE_URL}/simulate/what-if`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unit_price: unitPrice,
      lead_time_days: leadTimeDays,
      supplier_reliability: supplierReliability,
      downtime_cost_per_day: downtimeCostPerDay,
      weights,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to simulate scenario');
  }
  return res.json();
}

export async function fetchBenchmarks(): Promise<BenchmarkSummary> {
  const res = await fetch(`${BASE_URL}/benchmarks/summary`);
  if (!res.ok) throw new Error('Failed to fetch benchmark summary');
  return res.json();
}

export async function triggerBenchmarkRun(): Promise<any> {
  const res = await fetch(`${BASE_URL}/benchmarks/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run benchmark matrix');
  return res.json();
}

export async function testGuardrailPrompt(text: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/guardrails/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to test guardrail');
  return res.json();
}
