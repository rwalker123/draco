import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GolferStatsCards from '../GolferStatsCards';

describe('GolferStatsCards', () => {
  describe('base stats', () => {
    it('renders rounds played', () => {
      render(<GolferStatsCards roundsPlayed={12} handicapIndex={8.4} averageScore={85} />);

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Rounds Played')).toBeInTheDocument();
    });

    it('renders handicap index formatted to one decimal place', () => {
      render(<GolferStatsCards roundsPlayed={12} handicapIndex={8.4} averageScore={85} />);

      expect(screen.getByText('8.4')).toBeInTheDocument();
      expect(screen.getByText('Handicap Index')).toBeInTheDocument();
    });

    it('renders average score rounded to nearest integer', () => {
      render(<GolferStatsCards roundsPlayed={12} handicapIndex={8.4} averageScore={84.6} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
    });

    it('renders custom seasonLabel when provided', () => {
      render(
        <GolferStatsCards
          roundsPlayed={5}
          handicapIndex={10.2}
          averageScore={90}
          seasonLabel="Spring 2025"
        />,
      );

      expect(screen.getByText('Spring 2025')).toBeInTheDocument();
    });

    it('uses default season label when seasonLabel is not provided', () => {
      render(<GolferStatsCards roundsPlayed={5} handicapIndex={10.2} averageScore={90} />);

      expect(screen.getByText('Total rounds')).toBeInTheDocument();
    });
  });

  describe('null handicap', () => {
    it('renders "--" when handicapIndex is null', () => {
      render(<GolferStatsCards roundsPlayed={1} handicapIndex={null} averageScore={null} />);

      expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(1);
    });

    it('renders "Enter 3+ scores to calculate" subtitle when handicapIndex is null', () => {
      render(<GolferStatsCards roundsPlayed={1} handicapIndex={null} averageScore={null} />);

      expect(screen.getByText('Enter 3+ scores to calculate')).toBeInTheDocument();
    });

    it('renders "--" for average score when averageScore is null', () => {
      render(<GolferStatsCards roundsPlayed={1} handicapIndex={null} averageScore={null} />);

      const dashes = screen.getAllByText('--');
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('initial handicap', () => {
    it('renders "Initial handicap (manual entry)" subtitle when isInitialHandicap is true', () => {
      render(
        <GolferStatsCards
          roundsPlayed={3}
          handicapIndex={15.0}
          averageScore={95}
          isInitialHandicap
        />,
      );

      expect(screen.getByText('Initial handicap (manual entry)')).toBeInTheDocument();
    });

    it('renders "Based on recent rounds" subtitle when isInitialHandicap is false', () => {
      render(
        <GolferStatsCards
          roundsPlayed={8}
          handicapIndex={12.3}
          averageScore={88}
          isInitialHandicap={false}
        />,
      );

      expect(screen.getByText('Based on recent rounds')).toBeInTheDocument();
    });
  });

  describe('additional stats cards', () => {
    it('does not render additional cards when all optional stats are undefined', () => {
      render(<GolferStatsCards roundsPlayed={5} handicapIndex={10.0} averageScore={88} />);

      expect(screen.queryByText('Total Birdies')).not.toBeInTheDocument();
      expect(screen.queryByText('Avg Putts/Round')).not.toBeInTheDocument();
      expect(screen.queryByText('Fairway %')).not.toBeInTheDocument();
      expect(screen.queryByText('GIR %')).not.toBeInTheDocument();
    });

    it('renders Total Birdies card when totalBirdies is provided', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          totalBirdies={14}
        />,
      );

      expect(screen.getByText('Total Birdies')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('Season total')).toBeInTheDocument();
    });

    it('renders Avg Putts/Round card when averagePuttsPerRound is provided', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          averagePuttsPerRound={31.4}
        />,
      );

      expect(screen.getByText('Avg Putts/Round')).toBeInTheDocument();
      expect(screen.getByText('31.4')).toBeInTheDocument();
      expect(screen.getByText('Per round average')).toBeInTheDocument();
    });

    it('renders Fairway % card when fairwayPercentage is provided', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          fairwayPercentage={65}
        />,
      );

      expect(screen.getByText('Fairway %')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('Fairways hit')).toBeInTheDocument();
    });

    it('renders GIR % card when girPercentage is provided', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          girPercentage={50}
        />,
      );

      expect(screen.getByText('GIR %')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Greens in regulation')).toBeInTheDocument();
    });

    it('renders all additional cards when all optional stats are provided', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          totalBirdies={14}
          averagePuttsPerRound={30.2}
          fairwayPercentage={60}
          girPercentage={45}
        />,
      );

      expect(screen.getByText('Total Birdies')).toBeInTheDocument();
      expect(screen.getByText('Avg Putts/Round')).toBeInTheDocument();
      expect(screen.getByText('Fairway %')).toBeInTheDocument();
      expect(screen.getByText('GIR %')).toBeInTheDocument();
    });

    it('renders only provided optional cards, not missing ones', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          totalBirdies={5}
        />,
      );

      expect(screen.getByText('Total Birdies')).toBeInTheDocument();
      expect(screen.queryByText('Avg Putts/Round')).not.toBeInTheDocument();
      expect(screen.queryByText('Fairway %')).not.toBeInTheDocument();
      expect(screen.queryByText('GIR %')).not.toBeInTheDocument();
    });

    it('formats averagePuttsPerRound to one decimal place', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          averagePuttsPerRound={31}
        />,
      );

      expect(screen.getByText('31.0')).toBeInTheDocument();
    });

    it('formats fairwayPercentage as a rounded percentage', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          fairwayPercentage={67.2}
        />,
      );

      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('formats girPercentage as a rounded percentage', () => {
      render(
        <GolferStatsCards
          roundsPlayed={10}
          handicapIndex={8.0}
          averageScore={82}
          girPercentage={38.9}
        />,
      );

      expect(screen.getByText('39%')).toBeInTheDocument();
    });
  });
});
