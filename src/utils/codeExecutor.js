// utils/codeExecutor.js

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

export const executeCodeWithPiston = async (code, language, input = '') => {
  const response = await fetch(`${PISTON_API_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language,
      source: code,
      stdin: input,
    }),
  });

  const result = await response.json();

  return {
    output: result.output || result.run.output || '',
    error: result.run?.stderr || '',
    exitCode: result.run?.code,
  };
};
