import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../../theme';
import { SchedulerFieldsConfig } from '../SchedulerFieldsConfig';

const { listMock, CONFIGS } = vi.hoisted(() => {
  const CONFIGS = Array.from({ length: 6 }, (_, i) => ({
    fieldId: String(i + 1),
    scheduleEnabled: true,
    gameLengthMinutes: 90,
    bufferMinutes: 15,
    openHours: [
      { id: `${i + 1}-oh`, dayOfWeek: 0, startTimeLocal: '09:00', endTimeLocal: '17:00' },
    ],
    closedDates: [],
  }));
  return { listMock: vi.fn().mockResolvedValue(CONFIGS), CONFIGS };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ token: 'tok' }),
}));

vi.mock('../../../hooks/useApiClient', () => ({
  useApiClient: () => ({}),
}));

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

describe('SchedulerFieldsConfig render cost', () => {
  beforeEach(() => {
    listMock.mockClear();
  });

  it('does not mount the per-field day editor for collapsed rows', async () => {
    renderConfig();

    // Wait for the batch load to populate the rows.
    await screen.findByText('Field 1');

    // All rows start collapsed. The heavy day editor ("Open Hours" section) must
    // not be mounted for any collapsed row — otherwise all N editors render at once.
    expect(screen.queryAllByText('Open Hours')).toHaveLength(0);
    expect(screen.queryAllByText('Quick Set')).toHaveLength(0);
  });

  it('renders every field row (summary + enable toggle) without any editors', async () => {
    const { container } = renderConfig();
    await screen.findByText('Field 1');

    // Each field still gets a collapsible row with its enable checkbox and name,
    // so the list itself renders fully — only the heavy editors are deferred.
    expect(container.querySelectorAll('.MuiAccordionSummary-root')).toHaveLength(FIELDS.length);
    expect(screen.getAllByRole('checkbox')).toHaveLength(FIELDS.length);
    FIELDS.forEach((f) => expect(screen.getByText(f.name)).toBeInTheDocument());
    expect(screen.queryAllByText('Game Settings')).toHaveLength(0);
  });
});
