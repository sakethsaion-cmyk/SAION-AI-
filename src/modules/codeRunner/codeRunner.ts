export interface CodeRunResult {
  output: string;
  error: string | null;
  executionTimeMs: number;
  language: string;
}

function runJavaScript(code: string): Promise<CodeRunResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const logs: string[] = [];
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.setAttribute('sandbox', 'allow-scripts');
      document.body.appendChild(iframe);
      const iwin = iframe.contentWindow as any;
      if (!iwin) { document.body.removeChild(iframe); return resolve({ output: '', error: 'Sandbox failed', executionTimeMs: 0, language: 'javascript' }); }
      iwin.console = {
        log: (...a: any[]) => logs.push(a.map((x: any) => { try { return typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x); } catch { return String(x); } }).join(' ')),
        error: (...a: any[]) => logs.push('❌ ' + a.map(String).join(' ')),
        warn: (...a: any[]) => logs.push('⚠️ ' + a.map(String).join(' ')),
      };
      const timer = setTimeout(() => { document.body.removeChild(iframe); resolve({ output: logs.join('\n'), error: '⏱️ Timeout (10s limit)', executionTimeMs: Date.now() - start, language: 'javascript' }); }, 10000);
      try {
        const fn = new iwin.Function(code);
        const result = fn();
        clearTimeout(timer);
        if (result !== undefined) logs.push(`→ ${JSON.stringify(result, null, 2)}`);
        document.body.removeChild(iframe);
        resolve({ output: logs.join('\n') || '(no output)', error: null, executionTimeMs: Date.now() - start, language: 'javascript' });
      } catch (err: any) {
        clearTimeout(timer);
        document.body.removeChild(iframe);
        resolve({ output: logs.join('\n'), error: err.message || String(err), executionTimeMs: Date.now() - start, language: 'javascript' });
      }
    } catch (err: any) {
      resolve({ output: '', error: err.message || 'Execution failed', executionTimeMs: Date.now() - start, language: 'javascript' });
    }
  });
}

export function detectLanguage(code: string, hint?: string): string {
  if (hint) return hint.toLowerCase();
  if (code.includes('print(') || code.includes('def ') || code.includes('import ') && code.includes(':')) return 'python';
  return 'javascript';
}

export async function runCode(code: string, language?: string): Promise<CodeRunResult> {
  const lang = detectLanguage(code, language);
  if (lang === 'python') {
    return { output: 'Python execution requires Pyodide to load. Try JavaScript instead.', error: null, executionTimeMs: 0, language: 'python' };
  }
  return runJavaScript(code);
}

export function isRunCodeRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('run this') || lower.includes('execute this') || lower.includes('run the code') || lower.includes('test this code') || lower.includes('can you run') || lower.includes('run it') || lower.includes('execute it');
}
