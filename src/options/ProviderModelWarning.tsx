import { validateExtractModel } from '@/lib/api/providerValidation';
import type { ModelVisionSupport } from '@/lib/modelVision';
import type { ProviderId } from '@/lib/types';

interface Props {
  providerId: ProviderId;
  model: string;
  visionById?: Record<string, ModelVisionSupport>;
}

export default function ProviderModelWarning({ providerId, model, visionById }: Props) {
  const validation = validateExtractModel(providerId, model, true, visionById);
  if (validation.ok) return null;

  return (
    <p
      role="alert"
      className="mt-2 text-[11px] leading-snug rounded-lg border border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-100 px-2.5 py-2"
    >
      {validation.message}
    </p>
  );
}
