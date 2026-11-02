import React, { useState } from 'react';

interface ParsedCoverLetterResponse {
  coverLetter: string;
  pdfBase64?: string;
  pdfFilename?: string;
}

const Dashboard = () => {
  const [coverLetter, setCoverLetter] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  const [pdfFilename, setPdfFilename] = useState('Cover Letter.pdf');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCoverLetter('');
    setPdfBase64('');
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
        const parsedCoverLetterResponse: ParsedCoverLetterResponse =
          await coverLetterResponse.json();
        setCoverLetter(parsedCoverLetterResponse.coverLetter);
        setPdfBase64(parsedCoverLetterResponse.pdfBase64 ?? '');
        setPdfFilename(
          parsedCoverLetterResponse.pdfFilename ?? 'Cover Letter.pdf',
        );
      }
    } catch (_err) {
      setError('Error processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBase64) {
      return;
    }
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFilename;
    link.click();
    URL.revokeObjectURL(url);
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
            <button type="button" onClick={handleDownloadPdf} disabled={!pdfBase64}>
              Download PDF
            </button>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {coverLetter}
            </pre>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
