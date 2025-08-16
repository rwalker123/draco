import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../theme';
import RoleIcon from '../users/RoleIcon';
import * as roleIcons from '../../utils/roleIcons';

// Mock the role utilities
vi.mock('../../utils/roleIcons', () => ({
  getRoleIcon: vi.fn(),
  getRoleTooltipText: vi.fn(),
  getRoleColors: vi.fn(),
}));

const mockRole = {
  id: '1',
  roleId: '93DAC465-4C64-4422-B444-3CE79C549329',
  roleName: 'Administrator',
  roleData: '1',
  contextName: undefined,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={dracoTheme}>{component}</ThemeProvider>);
};

describe('RoleIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const mockGetRoleIcon = roleIcons.getRoleIcon as ReturnType<typeof vi.fn>;
    const mockGetRoleTooltipText = roleIcons.getRoleTooltipText as ReturnType<typeof vi.fn>;
    const mockGetRoleColors = roleIcons.getRoleColors as ReturnType<typeof vi.fn>;

    mockGetRoleIcon.mockReturnValue(() => <div data-testid="mock-icon">🏢</div>);
    mockGetRoleTooltipText.mockReturnValue('Administrator - Full system access');
    mockGetRoleColors.mockReturnValue({
      backgroundColor: '#ff0000',
      textColor: '#ffffff',
    });

    renderWithTheme(<RoleIcon role={mockRole} />);

    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('handles unknown roles gracefully', () => {
    const mockGetRoleIcon = roleIcons.getRoleIcon as ReturnType<typeof vi.fn>;
    const mockGetRoleTooltipText = roleIcons.getRoleTooltipText as ReturnType<typeof vi.fn>;
    const mockGetRoleColors = roleIcons.getRoleColors as ReturnType<typeof vi.fn>;

    mockGetRoleIcon.mockReturnValue(undefined);
    mockGetRoleTooltipText.mockReturnValue('Unknown Role');
    mockGetRoleColors.mockReturnValue({
      backgroundColor: '#cccccc',
      textColor: '#000000',
    });

    renderWithTheme(<RoleIcon role={mockRole} />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
