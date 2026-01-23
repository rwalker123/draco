import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FieldType } from '@draco/shared-schemas';
import { dracoTheme } from '../../../theme';
import type { FieldService } from '../../../hooks/useFieldService';
import { FieldsView, type FieldsViewRef } from '../FieldsView';

const listFieldsMock = vi.fn();

vi.mock('../../../hooks/useFieldService', () => ({
  useFieldService: (): Pick<FieldService, 'listFields'> => ({
    listFields: listFieldsMock,
  }),
}));

vi.mock('../FieldDetailsCard', () => ({
  __esModule: true,
  default: ({ field }: { field: FieldType | null }) => (
    <div data-testid="field-details-card">
      {field ? `Selected: ${field.name}` : 'No field selected'}
    </div>
  ),
}));

vi.mock('../../AccountPageHeader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="account-page-header">{children}</div>
  ),
}));

vi.mock('../../common/PageSectionHeader', () => ({
  __esModule: true,
  default: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div data-testid="page-section-header">
      <span>{title}</span>
      {actions}
    </div>
  ),
}));

const createMockField = (overrides: Partial<FieldType> = {}): FieldType => ({
  id: 'field-1',
  name: 'Central Park Field',
  shortName: 'Central',
  hasLights: false,
  schedulerStartIncrementMinutes: 165,
  address: '123 Park Ave',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  latitude: '40.7829',
  longitude: '-73.9654',
  rainoutNumber: '555-1234',
  comment: 'Great field',
  directions: 'Take the A train',
  ...overrides,
});

const renderFieldsView = (props: Partial<React.ComponentProps<typeof FieldsView>> = {}) => {
  const defaultProps = {
    accountId: 'account-123',
  };

  return render(
    <ThemeProvider theme={dracoTheme}>
      <FieldsView {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe('FieldsView', () => {
  const mockFields = [
    createMockField({ id: 'field-1', name: 'Central Park Field', shortName: 'Central' }),
    createMockField({
      id: 'field-2',
      name: 'Riverside Field',
      shortName: 'Riverside',
      city: 'Boston',
      state: 'MA',
    }),
    createMockField({
      id: 'field-3',
      name: 'Sunset Field',
      shortName: 'Sunset',
      city: 'Los Angeles',
      state: 'CA',
    }),
  ];

  const successResponse = {
    success: true as const,
    data: {
      fields: mockFields,
      pagination: { page: 1, limit: 10, total: 3, hasNext: false, hasPrev: false },
    },
    message: 'Fields loaded successfully',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    listFieldsMock.mockResolvedValue(successResponse);
  });

  describe('initial render and data loading', () => {
    it('loads and displays fields on mount', async () => {
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(screen.getByText('Riverside Field')).toBeInTheDocument();
      expect(screen.getByText('Sunset Field')).toBeInTheDocument();
    });

    it('calls listFields with default parameters', async () => {
      renderFieldsView();

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc',
          search: undefined,
        });
      });
    });

    it('selects the first field by default for details card', async () => {
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByTestId('field-details-card')).toHaveTextContent(
          'Selected: Central Park Field',
        );
      });
    });

    it('displays empty state when no fields exist', async () => {
      listFieldsMock.mockResolvedValue({
        success: true,
        data: {
          fields: [],
          pagination: { page: 1, limit: 10, total: 0, hasNext: false, hasPrev: false },
        },
        message: 'Fields loaded successfully',
      });

      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('No fields have been added yet.')).toBeInTheDocument();
      });
    });

    it('displays error alert when loading fails', async () => {
      listFieldsMock.mockResolvedValue({
        success: false,
        error: 'Network error occurred',
      });

      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error occurred');
      });
    });
  });

  describe('table columns', () => {
    it('displays all column headers', async () => {
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      const headers = screen.getAllByRole('columnheader');
      expect(headers.some((h) => h.textContent?.includes('Name'))).toBe(true);
      expect(headers.some((h) => h.textContent?.includes('Short Name'))).toBe(true);
      expect(headers.some((h) => h.textContent?.includes('City'))).toBe(true);
      expect(headers.some((h) => h.textContent?.includes('State'))).toBe(true);
      expect(headers.some((h) => h.textContent?.includes('Rainout Line'))).toBe(true);
    });

    it('displays field data in table cells', async () => {
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      const dataRow = rows[1];

      expect(within(dataRow).getByText('Central Park Field')).toBeInTheDocument();
      expect(within(dataRow).getByText('Central')).toBeInTheDocument();
      expect(within(dataRow).getByText('New York')).toBeInTheDocument();
      expect(within(dataRow).getByText('NY')).toBeInTheDocument();
      expect(within(dataRow).getByText('555-1234')).toBeInTheDocument();
    });

    it('displays dash for missing optional fields', async () => {
      listFieldsMock.mockResolvedValue({
        success: true,
        data: {
          fields: [createMockField({ city: null, state: null, rainoutNumber: null })],
          pagination: { page: 1, limit: 10, total: 1, hasNext: false, hasPrev: false },
        },
        message: 'Fields loaded successfully',
      });

      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      const dataRow = rows[1];
      const cells = within(dataRow).getAllByRole('cell');

      expect(cells[2]).toHaveTextContent('—');
      expect(cells[3]).toHaveTextContent('—');
      expect(cells[4]).toHaveTextContent('—');
    });
  });

  describe('row selection', () => {
    it('updates selected field when row is clicked', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Riverside Field'));

      expect(screen.getByTestId('field-details-card')).toHaveTextContent(
        'Selected: Riverside Field',
      );
    });

    it('highlights selected row', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      const row = screen.getByText('Riverside Field').closest('tr');
      await user.click(screen.getByText('Riverside Field'));

      expect(row).toHaveClass('Mui-selected');
    });
  });

  describe('sorting', () => {
    it('sorts by column when header is clicked', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      listFieldsMock.mockClear();

      const citySortLabel = screen.getByRole('button', { name: /City/i });
      await user.click(citySortLabel);

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'city',
            sortOrder: 'asc',
            page: 1,
          }),
        );
      });
    });

    it('toggles sort order when same column header is clicked again', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      const headers = screen.getAllByRole('columnheader');
      const nameHeader = headers.find((h) => h.textContent === 'Name');
      const nameSortLabel = within(nameHeader!).getByRole('button');
      await user.click(nameSortLabel);

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'name',
            sortOrder: 'desc',
          }),
        );
      });
    });

    it('resets to page 1 when sorting changes', async () => {
      const user = userEvent.setup();
      listFieldsMock.mockResolvedValue({
        success: true,
        data: {
          fields: mockFields,
          pagination: { page: 2, limit: 10, total: 25, hasNext: true, hasPrev: true },
        },
        message: 'Fields loaded successfully',
      });

      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      listFieldsMock.mockClear();

      const stateSortLabel = screen.getByRole('button', { name: /State/i });
      await user.click(stateSortLabel);

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
          }),
        );
      });
    });
  });

  describe('search', () => {
    it('filters fields by search term', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      listFieldsMock.mockClear();

      const searchInput = screen.getByPlaceholderText('Search fields');
      await user.type(searchInput, 'Riverside');

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Riverside',
            page: 1,
          }),
        );
      });
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search fields');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
      });

      listFieldsMock.mockClear();
      await user.click(screen.getByRole('button', { name: 'Clear search' }));

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            search: undefined,
          }),
        );
      });
    });

    it('resets to page 1 when search changes', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      listFieldsMock.mockClear();

      const searchInput = screen.getByPlaceholderText('Search fields');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
          }),
        );
      });
    });
  });

  describe('pagination', () => {
    it('displays pagination controls', async () => {
      listFieldsMock.mockResolvedValue({
        success: true,
        data: {
          fields: mockFields,
          pagination: { page: 1, limit: 10, total: 25, hasNext: true, hasPrev: false },
        },
        message: 'Fields loaded successfully',
      });

      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('changes page when next button is clicked', async () => {
      const user = userEvent.setup();
      listFieldsMock.mockResolvedValue({
        success: true,
        data: {
          fields: mockFields,
          pagination: { page: 1, limit: 10, total: 25, hasNext: true, hasPrev: false },
        },
        message: 'Fields loaded successfully',
      });

      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      listFieldsMock.mockClear();

      await user.click(screen.getByRole('button', { name: 'Go to next page' }));

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          }),
        );
      });
    });

    it('changes rows per page', async () => {
      const user = userEvent.setup();
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      listFieldsMock.mockClear();

      const rowsPerPageSelect = screen.getByRole('combobox');
      await user.click(rowsPerPageSelect);
      await user.click(screen.getByRole('option', { name: '25' }));

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 25,
            page: 1,
          }),
        );
      });
    });
  });

  describe('renderRowActions prop', () => {
    it('does not render actions column when renderRowActions is not provided', async () => {
      renderFieldsView();

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
    });

    it('renders actions column when renderRowActions is provided', async () => {
      const renderRowActions = vi.fn((field: FieldType) => (
        <button type="button" data-testid={`edit-${field.id}`}>
          Edit
        </button>
      ));

      renderFieldsView({ renderRowActions });

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
      expect(screen.getByTestId('edit-field-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-field-2')).toBeInTheDocument();
      expect(screen.getByTestId('edit-field-3')).toBeInTheDocument();
    });

    it('calls renderRowActions with field data', async () => {
      const renderRowActions = vi.fn(() => <button type="button">Action</button>);

      renderFieldsView({ renderRowActions });

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(renderRowActions).toHaveBeenCalledTimes(3);
      expect(renderRowActions).toHaveBeenCalledWith(mockFields[0]);
      expect(renderRowActions).toHaveBeenCalledWith(mockFields[1]);
      expect(renderRowActions).toHaveBeenCalledWith(mockFields[2]);
    });

    it('action button clicks do not trigger row selection', async () => {
      const user = userEvent.setup();
      const onActionClick = vi.fn();

      const renderRowActions = (field: FieldType) => (
        <button type="button" onClick={onActionClick} data-testid={`action-${field.id}`}>
          Action
        </button>
      );

      renderFieldsView({ renderRowActions });

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(screen.getByTestId('field-details-card')).toHaveTextContent(
        'Selected: Central Park Field',
      );

      await user.click(screen.getByTestId('action-field-2'));

      expect(onActionClick).toHaveBeenCalled();
      expect(screen.getByTestId('field-details-card')).toHaveTextContent(
        'Selected: Central Park Field',
      );
    });
  });

  describe('ref and refresh', () => {
    it('exposes refresh method via ref', async () => {
      const ref = React.createRef<FieldsViewRef>();

      render(
        <ThemeProvider theme={dracoTheme}>
          <FieldsView ref={ref} accountId="account-123" />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.refresh).toBe('function');
    });

    it('reloads data when refresh is called', async () => {
      const ref = React.createRef<FieldsViewRef>();

      render(
        <ThemeProvider theme={dracoTheme}>
          <FieldsView ref={ref} accountId="account-123" />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      expect(listFieldsMock).toHaveBeenCalledTimes(1);

      ref.current?.refresh();

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledTimes(2);
      });
    });

    it('preserves selected field after refresh if still in results', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<FieldsViewRef>();

      render(
        <ThemeProvider theme={dracoTheme}>
          <FieldsView ref={ref} accountId="account-123" />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Riverside Field'));
      expect(screen.getByTestId('field-details-card')).toHaveTextContent(
        'Selected: Riverside Field',
      );

      ref.current?.refresh();

      await waitFor(() => {
        expect(listFieldsMock).toHaveBeenCalledTimes(2);
      });

      expect(screen.getByTestId('field-details-card')).toHaveTextContent(
        'Selected: Riverside Field',
      );
    });

    it('selects first field if previously selected field is no longer in results', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<FieldsViewRef>();

      render(
        <ThemeProvider theme={dracoTheme}>
          <FieldsView ref={ref} accountId="account-123" />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Central Park Field')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Riverside Field'));
      expect(screen.getByTestId('field-details-card')).toHaveTextContent(
        'Selected: Riverside Field',
      );

      listFieldsMock.mockResolvedValue({
        success: true,
        data: {
          fields: [mockFields[0], mockFields[2]],
          pagination: { page: 1, limit: 10, total: 2, hasNext: false, hasPrev: false },
        },
        message: 'Fields loaded successfully',
      });

      ref.current?.refresh();

      await waitFor(() => {
        expect(screen.getByTestId('field-details-card')).toHaveTextContent(
          'Selected: Central Park Field',
        );
      });
    });
  });
});
