import type { AiTaskStage, AiTaskTrace } from './types';

export interface PromptContractInput {
  task: string;
  stage: AiTaskStage;
  promptVersion: string;
  outputSchema: string;
  strictJson?: boolean;
}

export function buildPromptContractHeader(input: PromptContractInput): string {
  const strictJson = input.strictJson !== false;
  return [
    '--- TRUYENFORGE_PROMPT_CONTRACT ---',
    `TASK=${input.task}`,
    `STAGE=${input.stage}`,
    `PROMPT_VERSION=${input.promptVersion}`,
    `OUTPUT_SCHEMA=${input.outputSchema}`,
    `STRICT_JSON=${strictJson ? '1' : '0'}`,
    '--- END_CONTRACT ---',
  ].join('\n');
}

export function prependPromptContract(promptBody: string, input: PromptContractInput): string {
  const header = buildPromptContractHeader(input);
  const body = String(promptBody || '').trim();
  return `${header}\n\n${body}`;
}

export function buildTraceMetadata(trace: AiTaskTrace, extra?: Record<string, unknown>): Record<string, unknown> {
  return {
    traceTask: trace.task,
    traceStage: trace.stage,
    tracePromptVersion: trace.promptVersion,
    traceRunId: trace.runId,
    ...(extra || {}),
  };
}
