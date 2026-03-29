export type AiTaskType =
  | 'story_generate'
  | 'story_translate'
  | 'story_continue'
  | 'story_cover'
  | 'quality_review';

export type AiTaskStage =
  | 'prepare'
  | 'analysis'
  | 'plan'
  | 'draft'
  | 'rewrite'
  | 'quality_gate'
  | 'finalize';

export type AiExecutionLane = 'fast' | 'quality';

export interface AiPromptBlueprint {
  task: AiTaskType;
  version: string;
  outputSchema: string;
  title: string;
  owner: string;
  updatedAt: string;
  notes: string;
}

export interface AiTaskTrace {
  task: AiTaskType;
  stage: AiTaskStage;
  promptVersion: string;
  runId: string;
}
