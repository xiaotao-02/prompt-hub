import { Loader2 } from 'lucide-react';

export interface AsyncStateBlockProps {
  state: 'loading' | 'error';
  errorTitle?: string;
  errorMessage?: string;
}

export function AsyncStateBlock({ state, errorTitle, errorMessage }: AsyncStateBlockProps) {
  if (state === 'loading') {
    return (
      <div className="card text-center text-sm text-zinc-500 py-10">
        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-zinc-400" />
        加载中…
      </div>
    );
  }

  return (
    <div className="card text-center text-sm text-red-600 dark:text-red-400 py-10 px-6">
      {errorTitle && <p className="font-medium mb-2">{errorTitle}</p>}
      {errorMessage && <p className="text-zinc-600 dark:text-zinc-400">{errorMessage}</p>}
    </div>
  );
}
