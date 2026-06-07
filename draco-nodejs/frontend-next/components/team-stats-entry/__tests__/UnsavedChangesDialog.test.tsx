import React from 'react';
import { render, screen } from '@testing-library/react';

import UnsavedChangesDialog from '../dialogs/UnsavedChangesDialog';
import type { UnsavedChangesPrompt } from '../types';

const renderDialog = (prompt: UnsavedChangesPrompt) =>
  render(
    <UnsavedChangesDialog
      open
      prompt={prompt}
      busyAction={null}
      error={null}
      onDecision={() => {}}
      onClose={() => {}}
    />,
  );

describe('UnsavedChangesDialog', () => {
  it('uses a spaced display label for the lineScore tab', () => {
    renderDialog({ reason: 'tab-change', playerName: 'Line Score', tab: 'lineScore' });

    expect(screen.getByText(/leaving the Line Score tab/)).toBeTruthy();
    expect(screen.queryByText(/LineScore/)).toBeNull();
  });

  it('capitalizes single-word tab labels', () => {
    renderDialog({ reason: 'tab-change', playerName: 'Jane Doe', tab: 'batting' });

    expect(screen.getByText(/leaving the Batting tab/)).toBeTruthy();
  });
});
