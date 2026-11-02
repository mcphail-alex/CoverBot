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
        pdfFilename: 'Cover Letter - Acme.pdf',
      });

    nock(window.location.origin)
      .persist()
      .post('/api', {
        naturalLanguageQuery: 'This API call fails',
      })
      .reply(500, {
        err: 'An error occurred',
      });

    nock(window.location.origin)
      .persist()
      .post('/api/pdf', (body) => typeof body.coverLetter === 'string')
      .reply(200, {
        pdfBase64: 'cGRm',
        pdfFilename: 'Cover Letter - Acme.pdf',
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

  test('shows editable cover letter on successful API call', async () => {
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
        screen.getByLabelText('Editable cover letter'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Editable cover letter')).toHaveValue(
      sampleCoverLetter,
    );
  });

  test('requests PDF with edited cover letter text on download', async () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText('Enter the job description here...'),
      {
        target: { value: 'Senior engineer role at Acme' },
      },
    );
    fireEvent.click(screen.getByText('Generate Cover Letter'));

    const editor = await screen.findByLabelText('Editable cover letter');
    fireEvent.change(editor, {
      target: { value: 'Dear Acme,\n\nEdited paragraph.\n' },
    });
    fireEvent.click(screen.getByText('Download PDF'));

    await waitFor(() =>
      expect(screen.queryByText('Building PDF...')).not.toBeInTheDocument(),
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
      expect(screen.getByLabelText('Editable cover letter')).toHaveValue(
        sampleCoverLetter,
      ),
    );
  });
});
