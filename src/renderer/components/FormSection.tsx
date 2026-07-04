import type { PropsWithChildren } from 'react';

interface FormSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="form-section">
      <div className="section-heading">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="section-fields">{children}</div>
    </section>
  );
}
