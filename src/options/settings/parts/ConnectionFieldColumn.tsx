import type { ReactNode } from 'react';
import { Field } from '@/components/ui';

/** 设置页双列连接字段（API Key / Base URL 等），基于 L2 Field */
export default function ConnectionFieldColumn({
  label,
  labelExtra,
  children,
}: {
  label: string;
  labelExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Field label={label} action={labelExtra} className="min-w-0">
      {children}
    </Field>
  );
}
