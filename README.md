# CoverBot: AI Cover Letter Generator

## Overview

CoverBot is a tool that automatically generates tailored cover letters based on your resume and job descriptions. Simply paste a job description into the application, and CoverBot will create a customized cover letter highlighting your relevant experience and skills.

## Setup

1. Place your resume as a plain-text `.txt` file in `server/data/` (e.g. `resume.txt`). If there is only one `.txt` file in that folder, it is picked up automatically. You can also set an explicit path:
   ```
   RESUME_PATH=server/data/your-resume.txt
   ```
2. Create a `.env` file in the root directory with your OpenAI API key (Node.js 22+ required for the OpenAI SDK):
   ```
   OPENAI_API_KEY=your_api_key_here
   # optional — defaults to gpt-6-astra
   OPENAI_MODEL=gpt-6-astra
   ```
   `OPEN_AI_KEY` is still accepted for older setups.
3. Start the application
4. Paste a job description into the input window
5. The tool will generate a personalized cover letter that you can copy from the output window

## Usage

1. Open the application in your browser
2. In the job description field, paste the complete job listing text
3. Click "Generate Cover Letter"
4. Review the generated cover letter in the output window
5. Copy the text or click **Download PDF** for a letterhead PDF (single page)

## Current Features

- Personalized cover letter generation based on your resume and job descriptions
- User-friendly interface
- Fast generation using OpenAI's language models
- Single-page PDF export on your letterhead (`server/assets/letterhead.pdf`)

## Upcoming Features
- Resume import/update capability
- Additional customization options

## Development

### Getting Started

- Fork and clone this repo
- Add your resume and OpenAI API key as described in the setup section
- Install dependencies with `npm install`
- Start the development server with `npm start`

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
