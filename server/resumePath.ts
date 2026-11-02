import fs from 'fs';
import path from 'path';

function getDataDir(): string {
  return path.join(process.cwd(), 'server/data');
}

function resolveConfiguredPath(): string | undefined {
  const configured = process.env.RESUME_PATH?.trim();
  if (!configured) {
    return undefined;
  }
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function findSingleTxtInDataDir(): string | undefined {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    return undefined;
  }

  const txtFiles = fs
    .readdirSync(dataDir)
    .filter((name) => name.toLowerCase().endsWith('.txt'))
    .map((name) => path.join(dataDir, name));

  return txtFiles.length === 1 ? txtFiles[0] : undefined;
}

/** Path to the resume file on disk (UTF-8 plain text). */
export function getResumeFilePath(): string {
  const configured = resolveConfiguredPath();
  if (configured) {
    return configured;
  }

  const dataDir = getDataDir();
  const defaultTxt = path.join(dataDir, 'resume.txt');
  if (fs.existsSync(defaultTxt)) {
    return defaultTxt;
  }

  const onlyTxt = findSingleTxtInDataDir();
  if (onlyTxt) {
    return onlyTxt;
  }

  const legacyDoc = path.join(dataDir, 'resume.doc');
  if (fs.existsSync(legacyDoc)) {
    return legacyDoc;
  }

  return defaultTxt;
}

export function readResumeText(): string {
  const resumeFilePath = getResumeFilePath();
  return fs.readFileSync(resumeFilePath, 'utf-8');
}
