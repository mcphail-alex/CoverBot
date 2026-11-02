/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';
import 'whatwg-fetch';
import nock from 'nock';

const sampleCoverLetter =
  'Dear Hiring Manager,\n\nI am excited to apply for this role.\n';

describe('Dashboard Component', () => {
  beforeAll(() => {
    nock(window.location.origin)
      .persist()
      .post('/api', {
        naturalLanguageQuery: 'Senior engineer role at Acme',
      })
      .reply(200, {
        coverLetter: sampleCoverLetter,
        pdfBase64: 'cGRm',
      });

    nock(window.location.origin)
      .persist()
      .post('/api', {
        naturalLanguageQuery: 'This API call fails',
      })
      .reply(500, {
        err: 'An error occurred',
      });
  });

  afterAll(() => {
    nock.cleanAll();
  });

  test('renders the form elements correctly', () => {
    render(<Dashboard />);
    expect(
      screen.getByPlaceholderText('Enter the job description here...'),
    ).toBeInTheDocument();
    expect(screen.getByText('Generate Cover Letter')).toBeInTheDocument();
    expect(screen.getByText('Cover Letter')).toBeInTheDocument();
  });

  test('displays loading state when form is submitted', async () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText('Enter the job description here...'),
      {
        target: { value: 'Senior engineer role at Acme' },
      },
    );
    fireEvent.click(screen.getByText('Generate Cover Letter'));

    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  test('displays error message on failed API call', async () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText('Enter the job description here...'),
      {
        target: { value: 'This API call fails' },
      },
    );
    fireEvent.click(screen.getByText('Generate Cover Letter'));

    await waitFor(() =>
      expect(screen.getByText('An error occurred')).toBeInTheDocument(),
    );
  });

  test('displays generated cover letter on successful API call', async () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText('Enter the job description here...'),
      {
        target: { value: 'Senior engineer role at Acme' },
      },
    );
    fireEvent.click(screen.getByText('Generate Cover Letter'));

    await waitFor(() =>
      expect(
        screen.getByText(/I am excited to apply for this role/),
      ).toBeInTheDocument(),
    );
  });

  test('clears previous results and error messages on new submission', async () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText('Enter the job description here...'),
      {
        target: { value: 'This API call fails' },
      },
    );
    fireEvent.click(screen.getByText('Generate Cover Letter'));

    await waitFor(() =>
      expect(screen.getByText('An error occurred')).toBeInTheDocument(),
    );

    fireEvent.change(
      screen.getByPlaceholderText('Enter the job description here...'),
      {
        target: { value: 'Senior engineer role at Acme' },
      },
    );
    fireEvent.click(screen.getByText('Generate Cover Letter'));

    await waitFor(() =>
      expect(screen.queryByText('An error occurred')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/I am excited to apply for this role/),
      ).toBeInTheDocument(),
    );
  });
});
