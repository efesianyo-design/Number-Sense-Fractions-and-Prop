import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
  id?: string;
}

export const MathView: React.FC<MathViewProps> = ({
  latex,
  displayMode = false,
  className = '',
  id
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return `<span>${latex}</span>`;
    }
  }, [latex, displayMode]);

  return (
    <span
      id={id}
      className={`inline-block font-serif ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
