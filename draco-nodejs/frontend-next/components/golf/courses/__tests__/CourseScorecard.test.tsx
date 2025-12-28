import React from 'react';
import { render, screen } from '@testing-library/react';
import type { GolfCourseWithTeesType, GolfCourseTeeType } from '@draco/shared-schemas';
import CourseScorecard from '../CourseScorecard';

const createMockTee = (overrides: Partial<GolfCourseTeeType> = {}): GolfCourseTeeType => ({
  id: 'tee-1',
  courseId: 'course-1',
  teeName: 'Blue Tees',
  teeColor: 'blue',
  priority: 1,
  mensRating: 72.5,
  mensSlope: 130,
  womansRating: 74.5,
  womansSlope: 135,
  distances: [
    420, 380, 175, 510, 410, 395, 165, 525, 400, 430, 370, 180, 490, 420, 385, 170, 515, 395,
  ],
  ...overrides,
});

const createMockCourse = (
  overrides: Partial<GolfCourseWithTeesType> = {},
): GolfCourseWithTeesType => ({
  id: 'course-1',
  name: 'Test Golf Course',
  designer: 'Robert Trent Jones',
  yearBuilt: 1960,
  numberOfHoles: 18,
  address: '123 Fairway Dr',
  city: 'San Diego',
  state: 'CA',
  zip: '92101',
  country: 'USA',
  mensPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
  womansPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
  mensHandicap: [1, 3, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18],
  womansHandicap: [1, 3, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18],
  externalId: null,
  tees: [createMockTee()],
  ...overrides,
});

describe('CourseScorecard', () => {
  describe('header rendering', () => {
    it('displays course name', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getByRole('heading', { name: 'Test Golf Course' })).toBeInTheDocument();
    });

    it('displays city and state', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getByText('San Diego, CA')).toBeInTheDocument();
    });

    it('displays only city when state is not available', () => {
      const course = createMockCourse({ state: null });
      render(<CourseScorecard course={course} />);

      expect(screen.getByText('San Diego')).toBeInTheDocument();
    });

    it('displays only state when city is not available', () => {
      const course = createMockCourse({ city: null });
      render(<CourseScorecard course={course} />);

      expect(screen.getByText('CA')).toBeInTheDocument();
    });

    it('does not display location when neither city nor state is available', () => {
      const course = createMockCourse({ city: null, state: null });
      render(<CourseScorecard course={course} />);

      expect(screen.queryByText('San Diego')).not.toBeInTheDocument();
      expect(screen.queryByText('CA')).not.toBeInTheDocument();
    });
  });

  describe('tee ratings table', () => {
    it('displays tee ratings section when showTees is true', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getByText('Tee Ratings & Slopes')).toBeInTheDocument();
    });

    it('displays tee name', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getAllByText('Blue Tees')[0]).toBeInTheDocument();
    });

    it('displays mens rating', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getByText('72.5')).toBeInTheDocument();
    });

    it('displays mens slope', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getByText('130')).toBeInTheDocument();
    });

    it('displays womens rating', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getByText('74.5')).toBeInTheDocument();
    });

    it('displays womens slope', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getByText('135')).toBeInTheDocument();
    });

    it('does not display tee ratings when showTees is false', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees={false} />);

      expect(screen.queryByText('Tee Ratings & Slopes')).not.toBeInTheDocument();
    });

    it('does not display tee ratings when no tees available', () => {
      const course = createMockCourse({ tees: [] });
      render(<CourseScorecard course={course} showTees />);

      expect(screen.queryByText('Tee Ratings & Slopes')).not.toBeInTheDocument();
    });
  });

  describe('scorecard tables', () => {
    it('displays Scorecard section header', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getByText('Scorecard')).toBeInTheDocument();
    });

    it('displays Front 9 table for 18-hole course', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getByText('Front 9')).toBeInTheDocument();
    });

    it('displays Back 9 table for 18-hole course', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getByText('Back 9')).toBeInTheDocument();
    });

    it('does not display Back 9 table for 9-hole course', () => {
      const course = createMockCourse({
        numberOfHoles: 9,
        mensPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        womansPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
      render(<CourseScorecard course={course} />);

      expect(screen.getByText('Front 9')).toBeInTheDocument();
      expect(screen.queryByText('Back 9')).not.toBeInTheDocument();
    });

    it('displays hole numbers 1-9 in Front 9 table', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      for (let i = 1; i <= 9; i++) {
        expect(screen.getAllByText(i.toString())[0]).toBeInTheDocument();
      }
    });

    it('displays Par (Men) row', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getAllByText('Par (Men)')[0]).toBeInTheDocument();
    });

    it('displays Par (Women) row', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getAllByText('Par (Women)')[0]).toBeInTheDocument();
    });

    it('displays Hdcp (Men) row', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getAllByText('Hdcp (Men)')[0]).toBeInTheDocument();
    });

    it('displays Hdcp (Women) row', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getAllByText('Hdcp (Women)')[0]).toBeInTheDocument();
    });

    it('displays Out column header for totals', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getAllByText('Out')[0]).toBeInTheDocument();
    });

    it('calculates correct par total for front 9', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} />);

      expect(screen.getAllByText('36')[0]).toBeInTheDocument();
    });
  });

  describe('tee filtering', () => {
    it('displays multiple tees when not filtered', () => {
      const course = createMockCourse({
        tees: [
          createMockTee({ id: 'tee-1', teeName: 'Blue Tees', priority: 1 }),
          createMockTee({ id: 'tee-2', teeName: 'White Tees', teeColor: 'white', priority: 2 }),
        ],
      });
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getAllByText('Blue Tees')[0]).toBeInTheDocument();
      expect(screen.getAllByText('White Tees')[0]).toBeInTheDocument();
    });

    it('filters to show only selected tee when selectedTeeId is provided', () => {
      const course = createMockCourse({
        tees: [
          createMockTee({ id: 'tee-1', teeName: 'Blue Tees', priority: 1 }),
          createMockTee({ id: 'tee-2', teeName: 'White Tees', teeColor: 'white', priority: 2 }),
        ],
      });
      render(<CourseScorecard course={course} showTees selectedTeeId="tee-1" />);

      expect(screen.getAllByText('Blue Tees')[0]).toBeInTheDocument();
      expect(screen.queryByText('White Tees')).not.toBeInTheDocument();
    });

    it('sorts tees by priority', () => {
      const course = createMockCourse({
        tees: [
          createMockTee({ id: 'tee-2', teeName: 'White Tees', teeColor: 'white', priority: 2 }),
          createMockTee({ id: 'tee-1', teeName: 'Blue Tees', priority: 1 }),
        ],
      });
      render(<CourseScorecard course={course} showTees />);

      const rows = screen.getAllByRole('row');
      const teeRows = rows.filter((row) => row.textContent?.includes('Tees'));
      expect(teeRows[0].textContent).toContain('Blue Tees');
    });
  });

  describe('distance display', () => {
    it('displays tee distances for each hole', () => {
      const course = createMockCourse();
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getAllByText('420').length).toBeGreaterThan(0);
      expect(screen.getAllByText('380').length).toBeGreaterThan(0);
    });

    it('calculates total distance for front 9', () => {
      const tee = createMockTee();
      const frontNineTotal = tee.distances.slice(0, 9).reduce((sum, d) => sum + d, 0);
      const course = createMockCourse({ tees: [tee] });
      render(<CourseScorecard course={course} showTees />);

      expect(screen.getByText(frontNineTotal.toString())).toBeInTheDocument();
    });
  });
});
