import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import GameRecapSection, { type GameRecapSectionHandle } from '../GameRecapSection';

const { MockRichTextEditor } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  interface MockEditorProps {
    initialValue?: string;
    placeholder?: string;
    disabled?: boolean;
  }

  interface MockEditorHandle {
    getSanitizedContent: () => string;
  }

  const MockRichTextEditor = React.forwardRef(function MockRichTextEditor(
    { initialValue = '', placeholder, disabled }: MockEditorProps,
    ref: React.ForwardedRef<MockEditorHandle>,
  ) {
    const [content, setContent] = React.useState(initialValue);

    React.useImperativeHandle(ref, () => ({
      getSanitizedContent: () => content,
    }));

    return React.createElement('textarea', {
      'data-testid': 'mock-rich-text-editor',
      value: content,
      placeholder,
      disabled,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value),
    });
  });

  return { MockRichTextEditor };
});

vi.mock('../../email/RichTextEditor', () => ({
  default: MockRichTextEditor,
}));

vi.mock('../../common/RichTextContent', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'mock-rich-text-content' },
      props.html || props.emptyFallback,
    );
  },
}));

vi.mock('../../../utils/sanitization', () => ({
  sanitizeRichContent: (html: string) => html,
}));

const asyncNoop = async () => {};

describe('GameRecapSection', () => {
  it('renders loading state', () => {
    render(
      <GameRecapSection
        gameId="game-1"
        initialContent={null}
        loading={true}
        error={null}
        editMode={false}
        canEdit={false}
        onSave={asyncNoop}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <GameRecapSection
        gameId="game-1"
        initialContent={null}
        loading={false}
        error="Failed to load recap"
        editMode={false}
        canEdit={false}
        onSave={asyncNoop}
      />,
    );

    expect(screen.getByText('Failed to load recap')).toBeInTheDocument();
  });

  it('renders view mode with content', () => {
    render(
      <GameRecapSection
        gameId="game-1"
        initialContent="<p>Great game!</p>"
        loading={false}
        error={null}
        editMode={false}
        canEdit={false}
        onSave={asyncNoop}
      />,
    );

    expect(screen.getByTestId('mock-rich-text-content')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-rich-text-editor')).not.toBeInTheDocument();
  });

  it('renders edit mode with editor', () => {
    render(
      <GameRecapSection
        gameId="game-1"
        initialContent="<p>Great game!</p>"
        loading={false}
        error={null}
        editMode={true}
        canEdit={true}
        onSave={asyncNoop}
      />,
    );

    expect(screen.getByTestId('mock-rich-text-editor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save recap/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('shows correct helper text in view mode for editors', () => {
    render(
      <GameRecapSection
        gameId="game-1"
        initialContent={null}
        loading={false}
        error={null}
        editMode={false}
        canEdit={true}
        onSave={asyncNoop}
      />,
    );

    expect(screen.getByText('Enable edit mode to modify the recap.')).toBeInTheDocument();
  });

  it('shows correct helper text in view mode for non-editors', () => {
    render(
      <GameRecapSection
        gameId="game-1"
        initialContent={null}
        loading={false}
        error={null}
        editMode={false}
        canEdit={false}
        onSave={asyncNoop}
      />,
    );

    expect(screen.getByText('Game recap for this matchup.')).toBeInTheDocument();
  });

  it('shows correct helper text in edit mode', () => {
    render(
      <GameRecapSection
        gameId="game-1"
        initialContent={null}
        loading={false}
        error={null}
        editMode={true}
        canEdit={true}
        onSave={asyncNoop}
      />,
    );

    expect(screen.getByText('Write a summary of the game.')).toBeInTheDocument();
  });

  it('disables buttons while saving', async () => {
    const onSave = vi.fn(() => new Promise<void>(() => {}));

    render(
      <GameRecapSection
        gameId="game-1"
        initialContent="Content"
        loading={false}
        error={null}
        editMode={true}
        canEdit={true}
        onSave={onSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save recap/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /discard/i })).toBeDisabled();
    });
  });

  it('exposes hasDirtyContent via ref', () => {
    const ref = createRef<GameRecapSectionHandle>();

    render(
      <GameRecapSection
        ref={ref}
        gameId="game-1"
        initialContent=""
        loading={false}
        error={null}
        editMode={true}
        canEdit={true}
        onSave={asyncNoop}
      />,
    );

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.hasDirtyContent).toBe('function');
    expect(typeof ref.current?.saveContent).toBe('function');
    expect(typeof ref.current?.discardContent).toBe('function');
  });

  it('calls onSave when save button clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <GameRecapSection
        gameId="game-1"
        initialContent="Content"
        loading={false}
        error={null}
        editMode={true}
        canEdit={true}
        onSave={onSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save recap/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('shows error when save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

    render(
      <GameRecapSection
        gameId="game-1"
        initialContent="Content"
        loading={false}
        error={null}
        editMode={true}
        canEdit={true}
        onSave={onSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save recap/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty content', async () => {
    const onSave = vi.fn();

    render(
      <GameRecapSection
        gameId="game-1"
        initialContent=""
        loading={false}
        error={null}
        editMode={true}
        canEdit={true}
        onSave={onSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save recap/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Game recap cannot be empty.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
