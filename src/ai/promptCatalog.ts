import promptCatalogRaw from './promptCatalog.json';
import type { AiPromptBlueprint, AiTaskType } from './types';

const promptCatalog = promptCatalogRaw as Record<string, AiPromptBlueprint>;

export function getPromptBlueprint(task: AiTaskType): AiPromptBlueprint {
  const entry = promptCatalog[task];
  if (!entry) {
    return {
      task,
      version: '0.0.0',
      outputSchema: 'unknown',
      title: 'Unknown prompt',
      owner: 'unknown',
      updatedAt: '',
      notes: '',
    };
  }
  return entry;
}

export function getPromptVersion(task: AiTaskType): string {
  return getPromptBlueprint(task).version;
}

export function listPromptBlueprints(): AiPromptBlueprint[] {
  return Object.values(promptCatalog);
}
