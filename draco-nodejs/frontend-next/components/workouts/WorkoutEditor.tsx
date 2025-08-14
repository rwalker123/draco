'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { WorkoutForm } from './WorkoutForm';

export const WorkoutEditor: React.FC = () => {
  const { workoutId } = useParams();
  const mode = workoutId ? 'edit' : 'create';

  return <WorkoutForm mode={mode} />;
};
