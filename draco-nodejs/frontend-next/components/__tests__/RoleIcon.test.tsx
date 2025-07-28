import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../theme';
import RoleIcon from '../users/RoleIcon';
import * as roleIcons from '../../utils/roleIcons';

// Mock the role utilities
jest.mock('../../utils/roleIcons', () => ({
  getRoleIcon: jest.fn(),
  getRoleTooltipText: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    (roleIcons.getRoleIcon as jest.Mock).mockReturnValue(() => (
      <div data-testid="mock-icon">🏢</div>
    ));
    (roleIcons.getRoleTooltipText as jest.Mock).mockReturnValue(
      'Administrator - Full system access',
    );

    renderWithTheme(<RoleIcon role={mockRole} />);

    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('handles unknown roles gracefully', () => {
    (roleIcons.getRoleIcon as jest.Mock).mockReturnValue(undefined);
    (roleIcons.getRoleTooltipText as jest.Mock).mockReturnValue('Unknown Role');

    renderWithTheme(<RoleIcon role={mockRole} />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
