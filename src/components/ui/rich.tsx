import type { ReactNode } from 'react';

/** Balises autorisées dans les traductions (t.rich) : <br></br> et <em>…</em>. */
export const rich = {
  br: () => <br />,
  em: (chunks: ReactNode) => <em>{chunks}</em>,
};
