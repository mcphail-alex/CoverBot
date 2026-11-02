import React, { useState } from 'react';

interface GenerateCoverLetterResponse {
  coverLetter: string;
  pdfFilename?: string;
}

interface RenderPdfResponse {
  pdfBase64: string;
  pdfFilename: string;
}

const Dashboard = () => {
  const [coverLetter, setCoverLetter] = useState('');
  const [pdfFilename, setPdfFilename] = useState('Cover Letter.pdf');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCoverLetter('');
    setPdfFilename('Cover Letter.pdf');

    try {
      const coverLetterResponse = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ naturalLanguageQuery }),
      });

      if (coverLetterResponse.status !== 200) {
        const parsedError: { err: string } = await coverLetterResponse.json();
        setError(parsedError.err);
      } else {
        const parsed: GenerateCoverLetterResponse =
          await coverLetterResponse.json();
        setCoverLetter(parsed.coverLetter);
        setPdfFilename(parsed.pdfFilename ?? 'Cover Letter.pdf');
      }
    } catch (_err) {
      setError('Error processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!coverLetter.trim()) {
      return;
    }

    setPdfLoading(true);
    setError('');

    try {
      const pdfResponse = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetter,
          naturalLanguageQuery,
        }),
      });

      if (pdfResponse.status !== 200) {
        const parsedError: { err: string } = await pdfResponse.json();
        setError(parsedError.err);
        return;
      }

      const parsed: RenderPdfResponse = await pdfResponse.json();
      const binary = atob(parsed.pdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = parsed.pdfFilename || pdfFilename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (_err) {
      setError('Error building the PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <textarea
          value={naturalLanguageQuery}
          onChange={(e) => setNaturalLanguageQuery(e.target.value)}
          placeholder="Enter the job description here..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="result">
        <h2>Cover Letter</h2>
        {coverLetter && (
          <>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading || !coverLetter.trim()}
            >
              {pdfLoading ? 'Building PDF...' : 'Download PDF'}
            </button>
            <textarea
              className="cover-letter-editor"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              aria-label="Editable cover letter"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
