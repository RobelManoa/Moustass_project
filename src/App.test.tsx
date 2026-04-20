import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen headline', () => {
  render(<App />);
  const linkElement = screen.getByText(/plateforme video securisee/i);
  expect(linkElement).toBeInTheDocument();
});
