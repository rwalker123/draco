import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { PlayerSurveyCategoryType, PlayerSurveyDetailType } from '@draco/shared-schemas';
import SurveyManagementPage from '../SurveyManagementPage';

vi.mock('../../../../../../hooks/useApiClient', () => ({
  useApiClient: () => ({}),
}));

const listPlayerSurveyCategories = vi.fn();
const createPlayerSurveyCategory = vi.fn();
const updatePlayerSurveyCategory = vi.fn();
const deletePlayerSurveyCategory = vi.fn();
const createPlayerSurveyQuestion = vi.fn();
const updatePlayerSurveyQuestion = vi.fn();
const deletePlayerSurveyQuestion = vi.fn();
const listPlayerSurveys = vi.fn();
const upsertPlayerSurveyAnswer = vi.fn();
const deletePlayerSurveyAnswer = vi.fn();
const searchPublicContacts = vi.fn();
const getPlayerSurvey = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  listPlayerSurveyCategories: (...args: unknown[]) => listPlayerSurveyCategories(...args),
  createPlayerSurveyCategory: (...args: unknown[]) => createPlayerSurveyCategory(...args),
  updatePlayerSurveyCategory: (...args: unknown[]) => updatePlayerSurveyCategory(...args),
  deletePlayerSurveyCategory: (...args: unknown[]) => deletePlayerSurveyCategory(...args),
  createPlayerSurveyQuestion: (...args: unknown[]) => createPlayerSurveyQuestion(...args),
  updatePlayerSurveyQuestion: (...args: unknown[]) => updatePlayerSurveyQuestion(...args),
  deletePlayerSurveyQuestion: (...args: unknown[]) => deletePlayerSurveyQuestion(...args),
  listPlayerSurveys: (...args: unknown[]) => listPlayerSurveys(...args),
  upsertPlayerSurveyAnswer: (...args: unknown[]) => upsertPlayerSurveyAnswer(...args),
  deletePlayerSurveyAnswer: (...args: unknown[]) => deletePlayerSurveyAnswer(...args),
  searchPublicContacts: (...args: unknown[]) => searchPublicContacts(...args),
  getPlayerSurvey: (...args: unknown[]) => getPlayerSurvey(...args),
}));

const categories: PlayerSurveyCategoryType[] = [
  {
    id: 'cat-1',
    accountId: '1',
    categoryName: 'Background',
    priority: 1,
    questions: [
      {
        id: 'q-1',
        categoryId: 'cat-1',
        question: 'Hometown?',
        questionNumber: 1,
      },
    ],
  },
];

const surveyDetail: PlayerSurveyDetailType = {
  player: {
    id: 'player-1',
    firstName: 'Alex',
    lastName: 'Johnson',
    photoUrl: undefined,
  },
  answers: [
    {
      questionId: 'q-1',
      categoryId: 'cat-1',
      categoryName: 'Background',
      question: 'Hometown?',
      questionNumber: 1,
      answer: 'Austin',
    },
  ],
};

const surveySummary = {
  player: {
    id: 'player-1',
    firstName: 'Alex',
    lastName: 'Johnson',
    photoUrl: undefined,
  },
  answeredQuestionCount: 1,
  hasResponses: true,
};

const listPlayersResponse = {
  surveys: [surveySummary],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    hasNext: false,
    hasPrev: false,
  },
};

const renderPage = () => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <SurveyManagementPage accountId="1" />
    </ThemeProvider>,
  );
};

describe('SurveyManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listPlayerSurveyCategories.mockResolvedValue({ data: categories });
    listPlayerSurveys.mockResolvedValue({ data: listPlayersResponse });
    createPlayerSurveyCategory.mockResolvedValue({
      data: {
        id: 'cat-2',
        accountId: '1',
        categoryName: 'Training',
        priority: 2,
        questions: [],
      },
    });
    updatePlayerSurveyCategory.mockResolvedValue({
      data: categories[0],
    });
    createPlayerSurveyQuestion.mockResolvedValue({
      data: {
        id: 'new-question',
        categoryId: 'cat-1',
        question: 'New question',
        questionNumber: 2,
      },
    });
    updatePlayerSurveyQuestion.mockResolvedValue({
      data: {
        id: 'q-1',
        categoryId: 'cat-1',
        question: 'Updated?',
        questionNumber: 1,
      },
    });
    upsertPlayerSurveyAnswer.mockResolvedValue({
      data: {
        questionId: 'q-1',
        categoryId: 'cat-1',
        categoryName: 'Background',
        question: 'Hometown?',
        questionNumber: 1,
        answer: 'Dallas',
      },
    });
    deletePlayerSurveyAnswer.mockResolvedValue({});
    searchPublicContacts.mockResolvedValue({
      data: {
        results: [],
      },
    });
    getPlayerSurvey.mockResolvedValue({ data: surveyDetail });
  });

  it('renders survey categories after loading data', async () => {
    renderPage();

    await waitFor(() => {
      expect(listPlayerSurveyCategories).toHaveBeenCalled();
    });
    await waitFor(() => {
      const categoryNameInputs = screen.getAllByLabelText(/category name/i);
      expect(
        categoryNameInputs.some((input) => (input as HTMLInputElement).value === 'Background'),
      ).toBe(true);
    });
  });

  it('creates a new category', async () => {
    renderPage();

    await waitFor(() => {
      expect(listPlayerSurveyCategories).toHaveBeenCalled();
    });

    const categoryNameFields = await screen.findAllByLabelText(/category name/i);
    const priorityFields = await screen.findAllByLabelText(/priority/i);

    await userEvent.type(categoryNameFields[0], 'Training');
    await userEvent.type(priorityFields[0], '2');
    const addCategoryButton = screen.getByRole('button', { name: /add category/i });
    await userEvent.click(addCategoryButton);

    await waitFor(() => {
      expect(createPlayerSurveyCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: '1' },
          body: { categoryName: 'Training', priority: 2 },
        }),
      );
    });

    expect(await screen.findByText('Category created.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Training')).toBeInTheDocument();
  });

  it('defers loading player details until expansion', async () => {
    renderPage();

    await waitFor(() => {
      expect(listPlayerSurveyCategories).toHaveBeenCalled();
    });

    const responsesTab = screen.getByRole('tab', { name: /player responses/i });
    await userEvent.click(responsesTab);

    await waitFor(() => {
      expect(listPlayerSurveys).toHaveBeenCalledTimes(1);
    });

    expect(getPlayerSurvey).not.toHaveBeenCalled();

    const playerAccordionTrigger = await screen.findByRole('button', { name: /alex johnson/i });
    await userEvent.click(playerAccordionTrigger);

    await waitFor(() => {
      expect(getPlayerSurvey).toHaveBeenCalledTimes(1);
    });
  });

  it('saves an updated player answer', async () => {
    renderPage();

    await waitFor(() => {
      expect(listPlayerSurveyCategories).toHaveBeenCalled();
    });

    const responsesTab = screen.getByRole('tab', { name: /player responses/i });
    await userEvent.click(responsesTab);

    await waitFor(() => {
      expect(listPlayerSurveys).toHaveBeenCalled();
    });

    const playerAccordionTrigger = await screen.findByRole('button', { name: /alex johnson/i });
    await userEvent.click(playerAccordionTrigger);

    await waitFor(() => {
      expect(getPlayerSurvey).toHaveBeenCalled();
    });

    const answerField = await screen.findByLabelText('Answer');

    await userEvent.clear(answerField);
    await userEvent.type(answerField, 'Dallas');

    const saveButton = screen.getByRole('button', { name: /save answer/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(upsertPlayerSurveyAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          path: {
            accountId: '1',
            playerId: 'player-1',
            questionId: 'q-1',
          },
          body: { answer: 'Dallas' },
        }),
      );
    });

    expect(await screen.findByText('Answer saved.')).toBeInTheDocument();
  });

  it('shows a message when a searched player has not completed the survey', async () => {
    searchPublicContacts.mockResolvedValue({
      data: {
        results: [
          {
            id: 'player-2',
            firstName: 'Jamie',
            lastName: 'Smith',
            photoUrl: undefined,
          },
        ],
      },
    });

    getPlayerSurvey.mockResolvedValue({
      data: {
        player: {
          id: 'player-2',
          firstName: 'Jamie',
          lastName: 'Smith',
          photoUrl: undefined,
        },
        answers: [],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(listPlayerSurveyCategories).toHaveBeenCalled();
    });

    const responsesTab = screen.getByRole('tab', { name: /player responses/i });
    await userEvent.click(responsesTab);

    const searchField = await screen.findByLabelText(/search players/i);
    await userEvent.type(searchField, 'Jam');

    await waitFor(() => {
      expect(searchPublicContacts).toHaveBeenCalled();
    });

    const option = await screen.findByRole('option', { name: /jamie smith/i });
    await userEvent.click(option);

    await waitFor(() => {
      expect(getPlayerSurvey).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: '1', playerId: 'player-2' },
        }),
      );
    });

    expect(
      await screen.findByText('Jamie Smith has not completed the survey yet.'),
    ).toBeInTheDocument();
  });
});
