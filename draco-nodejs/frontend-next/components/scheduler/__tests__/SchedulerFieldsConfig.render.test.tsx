import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../../theme';
import { SchedulerFieldsConfig } from '../SchedulerFieldsConfig';

const { listMock, CONFIGS } = vi.hoisted(() => {
  const CONFIGS = Array.from({ length: 6 }, (_, i) => ({
    fieldId: String(i + 1),
    scheduleEnabled: i % 2 === 0,
    gameLengthMinutes: 90,
    bufferMinutes: 15,
    openHours: [
      { id: `${i + 1}-oh`, dayOfWeek: 0, startTimeLocal: '09:00', endTimeLocal: '17:00' },
    ],
    closedDates: [],
  }));
  return { listMock: vi.fn().mockResolvedValue(CONFIGS), CONFIGS };
});

vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ token: 'tok' }) }));
vi.mock('../../../hooks/useApiClient', () => ({ useApiClient: () => ({}) }));
vi.mock('../../../services/fieldScheduleConfigService', () => ({
  FieldScheduleConfigService: class {
    listFieldScheduleConfigs = listMock;
    replaceFieldScheduleConfig = vi.fn();
    getFieldScheduleConfig = vi.fn();
  },
}));

const FIELDS = CONFIGS.map((c) => ({ id: c.fieldId, name: `Field ${c.fieldId}` }));

const renderConfig = () =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <SchedulerFieldsConfig
        accountId="1"
        fields={FIELDS}
        setSuccess={vi.fn()}
        setError={vi.fn()}
      />
    </ThemeProvider>,
  );

const expandSection = () => fireEvent.click(screen.getByRole('button', { name: /Fields/ }));

describe('SchedulerFieldsConfig table', () => {
  beforeEach(() => listMock.mockClear());

  it('summarizes available count and keeps the table collapsed by default', async () => {
    renderConfig();

    // 3 of 6 are available (even indices). Summary shows while collapsed.
    expect(await screen.findByText('3 of 6 available')).toBeInTheDocument();

    // Collapsed: no table, no field rows mounted.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Field 1')).not.toBeInTheDocument();
  });

  it('renders one compact row per field with no editors mounted until a cell is opened', async () => {
    renderConfig();
    await screen.findByText('3 of 6 available');
    expandSection();

    // Table renders one row per field with an inline schedule switch each.
    expect(await screen.findByRole('table')).toBeInTheDocument();
    FIELDS.forEach((f) => expect(screen.getByText(f.name)).toBeInTheDocument());
    expect(screen.getByLabelText('Field 1 available for scheduling')).toBeInTheDocument();

    // No heavy editor is mounted — "Weekdays" only exists inside the open-hours popover.
    expect(screen.queryByText('Weekdays')).not.toBeInTheDocument();
  });

  it('opens the open-hours popover only when its cell is clicked', async () => {
    renderConfig();
    await screen.findByText('3 of 6 available');
    expandSection();
    await screen.findByRole('table');

    expect(screen.queryByText('Weekdays')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open hours for Field 1' }));

    expect(await screen.findByText('Weekdays')).toBeInTheDocument();
  });

  it('filters to available-only fields when toggled', async () => {
    renderConfig();
    await screen.findByText('3 of 6 available');
    expandSection();
    await screen.findByRole('table');

    expect(screen.getByText('Field 2')).toBeInTheDocument(); // index 1 -> not available

    fireEvent.click(screen.getByLabelText('Show available only'));

    expect(screen.queryByText('Field 2')).not.toBeInTheDocument();
    expect(screen.getByText('Field 1')).toBeInTheDocument(); // index 0 -> available
  });

  it('flags available fields with no open hours in the summary and the row', async () => {
    const oneHour = [{ id: 'oh', dayOfWeek: 0, startTimeLocal: '09:00', endTimeLocal: '17:00' }];
    listMock.mockResolvedValue([
      {
        fieldId: '1',
        scheduleEnabled: true,
        gameLengthMinutes: 90,
        bufferMinutes: 15,
        openHours: [],
        closedDates: [],
      },
      {
        fieldId: '2',
        scheduleEnabled: true,
        gameLengthMinutes: 90,
        bufferMinutes: 15,
        openHours: oneHour,
        closedDates: [],
      },
      {
        fieldId: '3',
        scheduleEnabled: false,
        gameLengthMinutes: 90,
        bufferMinutes: 15,
        openHours: [],
        closedDates: [],
      },
    ]);

    render(
      <ThemeProvider theme={dracoTheme}>
        <SchedulerFieldsConfig
          accountId="1"
          fields={[
            { id: '1', name: 'Field 1' },
            { id: '2', name: 'Field 2' },
            { id: '3', name: 'Field 3' },
          ]}
          setSuccess={vi.fn()}
          setError={vi.fn()}
        />
      </ThemeProvider>,
    );

    // 2 enabled (fields 1 and 2), 1 of them missing open hours.
    expect(await screen.findByText('2 of 3 available (1 error)')).toBeInTheDocument();

    expandSection();
    await screen.findByRole('table');

    // The available-but-unconfigured field shows the inline error alert; the configured one does not.
    expect(
      screen.getByText('Set open hours or this field is skipped when scheduling.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/this field is skipped when scheduling/)).toHaveLength(1);
  });
});
