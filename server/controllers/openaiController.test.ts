import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { queryOpenAI } from './openaiController';

jest.mock('fs');
jest.mock('openai', () => {
  const mOpenAI = {
    responses: {
      create: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: jest.fn(() => mOpenAI),
  };
});

jest.mock('../openaiClient.js', () => ({
  getOpenAIClient: jest.fn(),
  DEFAULT_OPENAI_MODEL: 'gpt-6-astra',
}));

jest.mock('../resumePath.js', () => ({
  readResumeText: jest.fn(),
}));

import { getOpenAIClient } from '../openaiClient.js';
import { readResumeText } from '../resumePath.js';

describe('queryOpenAI', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    req = {};
    res = { locals: {} };
    next = jest.fn();
    mockCreate = jest.fn();
    (getOpenAIClient as jest.Mock).mockReturnValue({
      responses: { create: mockCreate },
    });
    jest.clearAllMocks();
    (readResumeText as jest.Mock).mockReturnValue('Sample resume content');
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('should return an error if no naturalLanguageQuery is provided', async () => {
    await queryOpenAI(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith({
      log: 'OpenAI query middleware did not receive a job description',
      status: 500,
      message: { err: 'An error occurred before querying OpenAI' },
    });
  });

  it('should return an error if OpenAI does not return a cover letter', async () => {
    res.locals!.naturalLanguageQuery = 'Senior engineer role at Acme';
    mockCreate.mockResolvedValue({ output_text: '   ' });

    await queryOpenAI(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        log: 'OpenAI did not return a cover letter',
        status: 500,
        message: { err: 'An error occurred while querying OpenAI' },
      }),
    );
  });

  it('should set res.locals.coverLetter if OpenAI returns text', async () => {
    res.locals!.naturalLanguageQuery = 'Senior engineer role at Acme';
    mockCreate.mockResolvedValue({
      output_text: 'Dear Hiring Manager,\n\nI am excited to apply.\n',
    });

    await queryOpenAI(req as Request, res as Response, next);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-6-astra',
        input: 'Senior engineer role at Acme',
        reasoning: { effort: 'low' },
        max_output_tokens: 650,
      }),
    );
    expect(res.locals!.coverLetter).toContain('Dear Hiring Manager');
    expect(next).toHaveBeenCalledWith();
  });

  it('should return an error if OpenAI throws an error', async () => {
    res.locals!.naturalLanguageQuery = 'Senior engineer role at Acme';
    mockCreate.mockRejectedValue(new Error('OpenAI error'));

    await queryOpenAI(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        log: 'OpenAI query failed: OpenAI error',
        status: 500,
        message: { err: 'An error occurred while querying OpenAI' },
      }),
    );
  });

  it('should return an error if the resume file cannot be read', async () => {
    res.locals!.naturalLanguageQuery = 'Senior engineer role at Acme';
    (readResumeText as jest.Mock).mockImplementation(() => {
      throw new Error('ENOENT');
    });

    await queryOpenAI(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        log: expect.stringContaining('Failed to read resume file'),
        status: 500,
        message: {
          err: 'Resume file is missing or unreadable. Add a .txt file under server/data or set RESUME_PATH in .env',
        },
      }),
    );
  });
});
