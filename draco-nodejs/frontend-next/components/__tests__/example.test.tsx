import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Example React test', () => {
  it('renders a message', () => {
    render(<div>Hello, test!</div>);
    expect(screen.getByText('Hello, test!')).toBeInTheDocument();
  });
});
