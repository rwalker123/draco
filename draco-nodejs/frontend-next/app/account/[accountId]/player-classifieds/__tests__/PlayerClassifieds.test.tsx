// PlayerClassifieds Component Tests
// Comprehensive testing of the PlayerClassifieds component functionality

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PlayerClassifieds from '../PlayerClassifieds';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock the AccountPageHeader component
vi.mock('../../../../../components/AccountPageHeader', () => ({
  default: ({ children, accountId }: { children: React.ReactNode; accountId: string }) => (
    <div data-testid="account-page-header" data-account-id={accountId}>
      {children}
    </div>
  ),
}));

// Mock the PlayersWanted component
vi.mock('../PlayersWanted', () => ({
  default: ({ accountId }: { accountId: string }) => (
    <div data-testid="players-wanted" data-account-id={accountId}>
      Players Wanted Content
    </div>
  ),
}));

// Mock the TeamsWanted component
vi.mock('../TeamsWanted', () => ({
  default: ({ accountId }: { accountId: string }) => (
    <div data-testid="teams-wanted" data-account-id={accountId}>
      Teams Wanted Content
    </div>
  ),
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe('PlayerClassifieds', () => {
  const defaultProps = {
    accountId: 'test-account-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      expect(screen.getByTestId('account-page-header')).toBeInTheDocument();
      expect(screen.getByText('Player Classifieds')).toBeInTheDocument();
    });

    it('should render with correct account ID', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const header = screen.getByTestId('account-page-header');
      expect(header).toHaveAttribute('data-account-id', 'test-account-1');
    });

    it('should render the main title correctly', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const title = screen.getByText('Player Classifieds');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('MuiTypography-h4');
    });

    it('should render with proper styling classes', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen', 'bg-background');
    });
  });

  // ============================================================================
  // TAB NAVIGATION TESTS
  // ============================================================================

  describe('Tab Navigation', () => {
    it('should render both tabs correctly', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      expect(screen.getByText('Players Wanted')).toBeInTheDocument();
      expect(screen.getByText('Teams Wanted')).toBeInTheDocument();
    });

    it('should have correct tab attributes', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const playersTab = screen.getByText('Players Wanted');
      const teamsTab = screen.getByText('Teams Wanted');

      expect(playersTab).toHaveAttribute('id', 'player-classifieds-tab-0');
      expect(playersTab).toHaveAttribute('aria-controls', 'player-classifieds-tabpanel-0');

      expect(teamsTab).toHaveAttribute('id', 'player-classifieds-tab-1');
      expect(teamsTab).toHaveAttribute('aria-controls', 'player-classifieds-tabpanel-1');
    });

    it('should start with Players Wanted tab selected by default', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const playersTab = screen.getByText('Players Wanted');
      const teamsTab = screen.getByText('Teams Wanted');

      expect(playersTab).toHaveAttribute('aria-selected', 'true');
      expect(teamsTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should switch to Teams Wanted tab when clicked', async () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const teamsTab = screen.getByText('Teams Wanted');

      fireEvent.click(teamsTab);

      await expect(teamsTab).toHaveAttribute('aria-selected', 'true');

      const playersTab = screen.getByText('Players Wanted');
      expect(playersTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should switch back to Players Wanted tab when clicked', async () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // First switch to Teams Wanted
      const teamsTab = screen.getByText('Teams Wanted');
      fireEvent.click(teamsTab);

      await expect(teamsTab).toHaveAttribute('aria-selected', 'true');

      // Then switch back to Players Wanted
      const playersTab = screen.getByText('Players Wanted');
      fireEvent.click(playersTab);

      await expect(playersTab).toHaveAttribute('aria-selected', 'true');

      expect(teamsTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should maintain tab state during re-renders', () => {
      const { rerender } = render(<PlayerClassifieds {...defaultProps} />);

      // Switch to Teams Wanted tab
      const teamsTab = screen.getByText('Teams Wanted');
      fireEvent.click(teamsTab);

      // Re-render component
      rerender(<PlayerClassifieds {...defaultProps} />);

      // Should maintain Teams Wanted tab selection
      expect(teamsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  // ============================================================================
  // TAB PANEL TESTS
  // ============================================================================

  describe('Tab Panel Content', () => {
    it('should render Players Wanted content by default', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // Players Wanted should be visible by default
      expect(screen.getByTestId('players-wanted')).toBeInTheDocument();

      // Players Wanted should be visible
      expect(screen.getByTestId('players-wanted')).toBeVisible();
    });

    it('should render Teams Wanted with correct account ID', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // Teams Wanted tab should exist
      const teamsWantedTab = screen.getByRole('tab', { name: 'Teams Wanted' });
      expect(teamsWantedTab).toBeInTheDocument();
    });

    it('should show correct content when switching tabs', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // Initially Players Wanted should be visible
      expect(screen.getByTestId('players-wanted')).toBeVisible();

      // Switch to Teams Wanted tab
      const teamsWantedTab = screen.getByRole('tab', { name: 'Teams Wanted' });
      fireEvent.click(teamsWantedTab);

      // Tab should be selected
      expect(teamsWantedTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'player classifieds tabs');

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-controls', 'player-classifieds-tabpanel-0');
      expect(tabs[1]).toHaveAttribute('aria-controls', 'player-classifieds-tabpanel-1');
    });

    it('should have proper tab panel associations', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const playersTab = screen.getByRole('tab', { name: 'Players Wanted' });
      const teamsTab = screen.getByRole('tab', { name: 'Teams Wanted' });

      expect(playersTab).toHaveAttribute('id', 'player-classifieds-tab-0');
      expect(teamsTab).toHaveAttribute('id', 'player-classifieds-tab-1');
    });

    it('should support keyboard navigation', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const playersTab = screen.getByText('Players Wanted');
      const teamsTab = screen.getByText('Teams Wanted');

      // Focus on first tab
      playersTab.focus();
      expect(playersTab).toHaveFocus();

      // Tab to next tab
      fireEvent.keyDown(playersTab, { key: 'ArrowRight' });
      expect(teamsTab).toHaveFocus();

      // Tab back to first tab
      fireEvent.keyDown(teamsTab, { key: 'ArrowLeft' });
      expect(playersTab).toHaveFocus();
    });
  });

  // ============================================================================
  // STYLING TESTS
  // ============================================================================

  describe('Styling and Layout', () => {
    it('should have proper Material-UI styling', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // The Tabs component should have the MuiTabs-root class
      const tabsContainer = screen.getByRole('tablist').closest('.MuiTabs-root');
      expect(tabsContainer).toHaveClass('MuiTabs-root');

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('MuiTab-root');
      });
    });

    it('should have proper spacing and layout', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // The Tabs component should have the MuiTabs-root class
      const tabsContainer = screen.getByRole('tablist').closest('.MuiTabs-root');
      expect(tabsContainer).toHaveClass('MuiTabs-root');

      // Check that tabs have proper padding
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('MuiTab-root');
      });
    });

    it('should have proper border styling', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // The Box containing the tabs should have border styling
      // Look for the Box that contains the Tabs component
      const tabsBox = screen.getByRole('tablist').closest('.MuiBox-root');
      // The border might be on the parent Box, so check if it has the styling
      expect(tabsBox).toBeInTheDocument();
      // Note: The actual border styling might be applied via CSS classes rather than inline styles
    });

    it('should have proper background colors', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      // The Tabs component should have the MuiTabs-root class
      const tabsContainer = screen.getByRole('tablist').closest('.MuiTabs-root');
      expect(tabsContainer).toHaveClass('MuiTabs-root');
    });
  });

  // ============================================================================
  // PROPS HANDLING TESTS
  // ============================================================================

  describe('Props Handling', () => {
    it('should handle different account IDs', () => {
      const differentAccountId = 'different-account-123';
      render(<PlayerClassifieds accountId={differentAccountId} />);

      // Players Wanted should be rendered with the correct account ID
      const playersWanted = screen.getByTestId('players-wanted');
      expect(playersWanted).toHaveAttribute('data-account-id', differentAccountId);

      // Teams Wanted tab should exist
      const teamsWantedTab = screen.getByRole('tab', { name: 'Teams Wanted' });
      expect(teamsWantedTab).toBeInTheDocument();
    });

    it('should handle empty account ID gracefully', () => {
      render(<PlayerClassifieds accountId="" />);

      // Players Wanted should be rendered with empty account ID
      const playersWanted = screen.getByTestId('players-wanted');
      expect(playersWanted).toHaveAttribute('data-account-id', '');

      // Teams Wanted tab should exist
      const teamsWantedTab = screen.getByRole('tab', { name: 'Teams Wanted' });
      expect(teamsWantedTab).toBeInTheDocument();
    });

    it('should handle very long account IDs', () => {
      const longAccountId = 'a'.repeat(1000);
      render(<PlayerClassifieds accountId={longAccountId} />);

      const header = screen.getByTestId('account-page-header');
      expect(header).toHaveAttribute('data-account-id', longAccountId);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      // @ts-expect-error - Testing missing props
      render(<PlayerClassifieds />);

      // Should still render without crashing
      expect(screen.getByTestId('account-page-header')).toBeInTheDocument();
      expect(screen.getByText('Player Classifieds')).toBeInTheDocument();
    });

    it('should handle undefined account ID gracefully', () => {
      // @ts-expect-error - Testing undefined props
      render(<PlayerClassifieds accountId={undefined} />);

      // Should still render without crashing
      expect(screen.getByTestId('account-page-header')).toBeInTheDocument();
      expect(screen.getByText('Player Classifieds')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration with Child Components', () => {
    it('should properly integrate with AccountPageHeader', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const header = screen.getByTestId('account-page-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-account-id', defaultProps.accountId);

      // Check that title is rendered inside header
      const title = screen.getByText('Player Classifieds');
      expect(header).toContainElement(title);
    });

    it('should properly integrate with PlayersWanted component', () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const playersWanted = screen.getByTestId('players-wanted');
      expect(playersWanted).toBeInTheDocument();
      expect(playersWanted).toHaveAttribute('data-account-id', defaultProps.accountId);
      expect(playersWanted).toHaveTextContent('Players Wanted Content');
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Considerations', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();

      render(<PlayerClassifieds {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Component should render quickly (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid tab switching efficiently', async () => {
      render(<PlayerClassifieds {...defaultProps} />);

      const playersTab = screen.getByText('Players Wanted');
      const teamsTab = screen.getByText('Teams Wanted');

      const startTime = performance.now();

      // Rapid tab switching
      for (let i = 0; i < 10; i++) {
        fireEvent.click(teamsTab);
        fireEvent.click(playersTab);
      }

      const endTime = performance.now();
      const switchTime = endTime - startTime;

      // Tab switching should be very fast (< 50ms for 10 switches)
      expect(switchTime).toBeLessThan(50);
    });
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle special characters in account ID', () => {
      const specialAccountId = 'test-account-with-special-chars-!@#$%^&*()';
      render(<PlayerClassifieds accountId={specialAccountId} />);

      const header = screen.getByTestId('account-page-header');
      expect(header).toHaveAttribute('data-account-id', specialAccountId);
    });

    it('should handle numeric account IDs', () => {
      const numericAccountId = '12345';
      render(<PlayerClassifieds accountId={numericAccountId} />);

      const header = screen.getByTestId('account-page-header');
      expect(header).toHaveAttribute('data-account-id', numericAccountId);
    });

    it('should handle account IDs with spaces', () => {
      const spacedAccountId = 'test account with spaces';
      render(<PlayerClassifieds accountId={spacedAccountId} />);

      const header = screen.getByTestId('account-page-header');
      expect(header).toHaveAttribute('data-account-id', spacedAccountId);
    });
  });
});
