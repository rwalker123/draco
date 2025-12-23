import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../../theme';
import { PageSectionHeader } from '../PageSectionHeader';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={dracoTheme}>{component}</ThemeProvider>);
};

describe('PageSectionHeader', () => {
  describe('default rendering', () => {
    it('renders title text', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders as h2 element by default', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Title');
    });

    it('applies default fontWeight of 600', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({ fontWeight: 600 });
    });

    it('renders without wrapper Box when no divider or actions', () => {
      const { container } = renderWithTheme(<PageSectionHeader title="Test Title" />);
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes).toHaveLength(0);
    });
  });

  describe('variant prop', () => {
    it('renders with h5 variant', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" variant="h5" />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('MuiTypography-h5');
    });

    it('renders with h6 variant by default', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('MuiTypography-h6');
    });
  });

  describe('component prop (accessibility)', () => {
    it('renders as h1 when component="h1"', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" component="h1" />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders as h2 when component="h2"', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" component="h2" />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('renders as h3 when component="h3"', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" component="h3" />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('maintains correct heading hierarchy with different variants', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" variant="h5" component="h3" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass('MuiTypography-h5');
    });
  });

  describe('fontWeight prop', () => {
    it('applies custom fontWeight', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" fontWeight={700} />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({ fontWeight: 700 });
    });

    it('applies lighter fontWeight', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" fontWeight={400} />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({ fontWeight: 400 });
    });
  });

  describe('showDivider prop', () => {
    it('wraps content in Box when showDivider is true', () => {
      const { container } = renderWithTheme(<PageSectionHeader title="Test Title" showDivider />);
      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });

    it('applies border styling when showDivider is true', () => {
      const { container } = renderWithTheme(<PageSectionHeader title="Test Title" showDivider />);
      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
      expect(box).toHaveStyle({ borderBottomStyle: 'solid' });
    });

    it('applies padding when showDivider is true', () => {
      const { container } = renderWithTheme(<PageSectionHeader title="Test Title" showDivider />);
      const box = container.querySelector('.MuiBox-root');
      expect(box).toHaveStyle({ padding: '16px' });
    });
  });

  describe('gutterBottom prop', () => {
    it('applies margin-bottom when gutterBottom is true (no wrapper)', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" gutterBottom />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({ marginBottom: '16px' });
    });

    it('applies margin-bottom to wrapper when gutterBottom with showDivider', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader title="Test Title" gutterBottom showDivider />,
      );
      const box = container.querySelector('.MuiBox-root');
      expect(box).toHaveStyle({ marginBottom: '16px' });
    });

    it('applies margin-bottom to wrapper when gutterBottom with actions', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader title="Test Title" gutterBottom actions={<button>Action</button>} />,
      );
      const box = container.querySelector('.MuiBox-root');
      expect(box).toHaveStyle({ marginBottom: '16px' });
    });
  });

  describe('actions prop', () => {
    it('renders actions when provided', () => {
      renderWithTheme(<PageSectionHeader title="Test Title" actions={<button>Click Me</button>} />);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('wraps content in Box when actions are provided', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader title="Test Title" actions={<button>Action</button>} />,
      );
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThanOrEqual(1);
    });

    it('renders multiple action elements', () => {
      renderWithTheme(
        <PageSectionHeader
          title="Test Title"
          actions={
            <>
              <button>Action 1</button>
              <button>Action 2</button>
            </>
          }
        />,
      );
      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    });

    it('renders complex action components', () => {
      renderWithTheme(
        <PageSectionHeader
          title="Test Title"
          actions={
            <div data-testid="custom-actions">
              <span>Custom Content</span>
            </div>
          }
        />,
      );
      expect(screen.getByTestId('custom-actions')).toBeInTheDocument();
    });
  });

  describe('sx prop', () => {
    it('applies custom sx styles when no wrapper', () => {
      renderWithTheme(
        <PageSectionHeader title="Test Title" sx={{ backgroundColor: 'rgb(255, 0, 0)' }} />,
      );
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('applies custom sx styles to wrapper Box when showDivider', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader
          title="Test Title"
          showDivider
          sx={{ backgroundColor: 'rgb(0, 255, 0)' }}
        />,
      );
      const box = container.querySelector('.MuiBox-root');
      expect(box).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('applies custom sx styles to wrapper Box when actions provided', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader
          title="Test Title"
          actions={<button>Action</button>}
          sx={{ backgroundColor: 'rgb(0, 0, 255)' }}
        />,
      );
      const box = container.querySelector('.MuiBox-root');
      expect(box).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });
    });
  });

  describe('prop combinations', () => {
    it('renders with showDivider and actions together', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader title="Combined Test" showDivider actions={<button>Action</button>} />,
      );
      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
      expect(box).toHaveStyle({ borderBottomStyle: 'solid' });
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('renders with all props combined', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader
          title="Full Test"
          variant="h5"
          component="h1"
          fontWeight={700}
          showDivider
          gutterBottom
          actions={<button>Full Action</button>}
          sx={{ borderRadius: '8px' }}
        />,
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Full Test');
      expect(heading).toHaveClass('MuiTypography-h5');
      expect(heading).toHaveStyle({ fontWeight: 700 });

      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
      expect(box).toHaveStyle({ borderBottomStyle: 'solid' });
      expect(box).toHaveStyle({ marginBottom: '16px' });
      expect(box).toHaveStyle({ borderRadius: '8px' });

      expect(screen.getByRole('button', { name: 'Full Action' })).toBeInTheDocument();
    });

    it('renders gutterBottom without wrapper (no divider, no actions)', () => {
      const { container } = renderWithTheme(<PageSectionHeader title="Gutter Test" gutterBottom />);
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes).toHaveLength(0);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({ marginBottom: '16px' });
    });

    it('applies sx and gutterBottom without wrapper', () => {
      renderWithTheme(
        <PageSectionHeader title="Style Test" gutterBottom sx={{ color: 'rgb(128, 0, 128)' }} />,
      );
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({
        marginBottom: '16px',
        color: 'rgb(128, 0, 128)',
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty title string', () => {
      renderWithTheme(<PageSectionHeader title="" />);
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });

    it('handles long title text', () => {
      const longTitle = 'A'.repeat(200);
      renderWithTheme(<PageSectionHeader title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      const specialTitle = '<Test> & \'Special\' "Characters"';
      renderWithTheme(<PageSectionHeader title={specialTitle} />);
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('handles null actions gracefully', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader title="Test Title" actions={null} />,
      );
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes).toHaveLength(0);
    });

    it('handles undefined actions gracefully', () => {
      const { container } = renderWithTheme(
        <PageSectionHeader title="Test Title" actions={undefined} />,
      );
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes).toHaveLength(0);
    });
  });
});
