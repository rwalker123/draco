export type UnsavedChangesReason = 'switch-row' | 'tab-change' | 'exit-edit' | 'game-change';

export type UnsavedChangesDecision = 'save' | 'discard' | 'cancel';

export interface UnsavedChangesPrompt {
  reason: UnsavedChangesReason;
  playerName: string;
  tab: 'batting' | 'pitching';
}

export interface EditableGridHandle {
  hasDirtyRow: () => boolean;
  getDirtyRowInfo: () => { rowId: string; playerName: string } | null;
  saveDirtyRow: () => Promise<boolean>;
  discardDirtyRow: () => void;
}

export interface StatsTabsCardHandle {
  hasPendingEdits: () => boolean;
  resolvePendingEdits: (reason: UnsavedChangesReason) => Promise<boolean>;
}
