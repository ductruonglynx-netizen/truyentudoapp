import type { AiProfileMode, ApiProvider } from '../apiVault';
import type { AiExecutionLane, AiTaskStage, AiTaskType } from './types';

export interface AiRouteInput {
  task: AiTaskType;
  stage: AiTaskStage;
  provider: ApiProvider;
  profile: AiProfileMode;
  inputChars: number;
  preferredLane?: AiExecutionLane;
}

export interface AiRouteDecision {
  lane: AiExecutionLane;
  reason: string;
}

export function routeAiExecutionLane(input: AiRouteInput): AiRouteDecision {
  const charCount = Math.max(0, Math.round(Number(input.inputChars || 0)));
  const preferred = input.preferredLane;

  if (preferred) {
    return {
      lane: preferred,
      reason: `forced-${preferred}`,
    };
  }

  if (input.task === 'story_translate') {
    if (input.stage === 'analysis' && charCount >= 30000) {
      return { lane: 'fast', reason: 'translate-analysis-large-context' };
    }
    if (charCount >= 16000) {
      return { lane: 'fast', reason: 'translate-large-batch' };
    }
    return { lane: 'quality', reason: 'translate-default-quality' };
  }

  if (input.task === 'story_continue' && input.stage === 'analysis' && charCount >= 60000) {
    return { lane: 'fast', reason: 'continue-analysis-very-large' };
  }

  if (input.task === 'story_generate' && input.stage === 'draft') {
    return { lane: 'quality', reason: 'story-draft-priority-quality' };
  }

  if (input.profile === 'economy' && input.stage !== 'quality_gate') {
    return { lane: 'fast', reason: 'economy-profile' };
  }

  if ((input.provider === 'groq' || input.provider === 'openrouter') && charCount >= 24000) {
    return { lane: 'fast', reason: 'provider-throughput-optimization' };
  }

  return { lane: 'quality', reason: 'default-quality' };
}
