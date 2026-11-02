import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { DEFAULT_OPENAI_MODEL, getOpenAIClient } from '../openaiClient.js';
import { readResumeText } from '../resumePath.js';
import { ensureFullSignOff } from '../signOff.js';
import { ServerError } from '../types';

const coverLettersFilePath = path.join(process.cwd(), 'server/data/cover_letters.json');

function buildInstructions(resume: string): string {
  const role = `You're an expert job search consultant who is helping a client seek a new tech role`;
  const task = `
        The user content will be a job description.
        1. read through the job description and identify the target audience, key skills and company values
        2. read through the resume provided below and find relevant experience to the job description
        3. format a cover letter for the candidate in the following structure:

        Dear [target audience],

        cover letter content

        All Best,
        Alex McPhail
        281-731-9656
        mcphail.alex@gmail.com
`;

  const rules = `
  1. Output plain text only (no markdown, bullets, or headings).
  2. Format as a left-justified business letter: single-spaced body, one blank line between paragraphs, one blank line after the salutation.
  3. HARD RULE — the entire letter MUST fit on exactly ONE printed page with normal margins. Never exceed ~260 words in the salutation and body (not counting the sign-off block). Use at most four short body paragraphs. If needed, shorten sentences rather than adding length.
  4. Always end with this exact sign-off block (including phone and email):
        All Best,
        Alex McPhail
        281-731-9656
        mcphail.alex@gmail.com
  5. Include only the cover letter itself — no notes, titles, or commentary.
  6. Don't lie or invent experience; only use the resume and reasonable inferences from it.
  7. Don't quote the job description verbatim; paraphrase when tying experience to requirements.
`;

  return `
  ${role}
  ${task}

  ${resume}

  Rules:
  ${rules}
`;
}

function appendCoverLetterToCache(
  jobDescription: string,
  coverLetter: string,
): void {
  let queriesData: Record<string, Array<{ returnedQuery: string }>> = {};
  if (fs.existsSync(coverLettersFilePath)) {
    const fileContent = fs.readFileSync(coverLettersFilePath, 'utf-8');
    queriesData = fileContent ? JSON.parse(fileContent) : {};
  }

  if (!queriesData[jobDescription]) {
    queriesData[jobDescription] = [];
  }
  queriesData[jobDescription].push({ returnedQuery: coverLetter });
  fs.writeFileSync(
    coverLettersFilePath,
    JSON.stringify(queriesData, null, 2),
    'utf-8',
  );
}

export const queryOpenAI: RequestHandler = async (_req, res, next) => {
  const { naturalLanguageQuery } = res.locals;
  if (!naturalLanguageQuery) {
    const error: ServerError = {
      log: 'OpenAI query middleware did not receive a job description',
      status: 500,
      message: { err: 'An error occurred before querying OpenAI' },
    };
    return next(error);
  }

  let resume: string;
  try {
    resume = readResumeText();
  } catch (err) {
    const error: ServerError = {
      log: `Failed to read resume file: ${(err as Error).message}`,
      status: 500,
      message: {
        err: 'Resume file is missing or unreadable. Add a .txt file under server/data or set RESUME_PATH in .env',
      },
    };
    return next(error);
  }

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: DEFAULT_OPENAI_MODEL,
      instructions: buildInstructions(resume),
      input: naturalLanguageQuery,
      reasoning: { effort: 'low' },
      max_output_tokens: 650,
    });

    const coverLetter = response.output_text?.trim();
    if (!coverLetter) {
      const error: ServerError = {
        log: 'OpenAI did not return a cover letter',
        status: 500,
        message: { err: 'An error occurred while querying OpenAI' },
      };
      return next(error);
    }

    const coverLetterWithSignOff = ensureFullSignOff(coverLetter);
    appendCoverLetterToCache(naturalLanguageQuery, coverLetterWithSignOff);
    res.locals.coverLetter = coverLetterWithSignOff;
    return next();
  } catch (err) {
    const error: ServerError = {
      log: `OpenAI query failed: ${(err as Error).message}`,
      status: 500,
      message: { err: 'An error occurred while querying OpenAI' },
    };
    return next(error);
  }
};
