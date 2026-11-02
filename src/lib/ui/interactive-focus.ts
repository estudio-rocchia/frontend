/** Shared focus ring for keyboard navigation (WCAG 2.4.7). */
export const interactiveFocusClass =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const formInputClass =
  `min-h-11 rounded-sm border border-border bg-bg-page px-3 py-2.5 text-sm text-text-primary focus:border-primary ${interactiveFocusClass}`;
