import fs from 'fs';
import path from 'path';
import { getResumeFilePath } from './resumePath';

jest.mock('fs');

describe('getResumeFilePath', () => {
  const projectRoot = '/project';

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);
    delete process.env.RESUME_PATH;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses RESUME_PATH when set', () => {
    process.env.RESUME_PATH = 'server/data/custom.txt';
    expect(getResumeFilePath()).toBe(
      path.join(projectRoot, 'server/data/custom.txt'),
    );
  });

  it('uses resume.txt when it exists', () => {
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
      filePath.endsWith(`${path.sep}resume.txt`),
    );
    expect(getResumeFilePath()).toBe(
      path.join(projectRoot, 'server/data/resume.txt'),
    );
  });

  it('uses the only .txt in server/data when resume.txt is missing', () => {
    const dataDir = path.join(projectRoot, 'server/data');
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === dataDir) {
        return true;
      }
      return false;
    });
    (fs.readdirSync as jest.Mock).mockReturnValue(['Alex McPhail 10-25.txt']);

    expect(getResumeFilePath()).toBe(
      path.join(dataDir, 'Alex McPhail 10-25.txt'),
    );
  });
});
