import { useEffect, useState } from 'react';

/** "What just happened" text: dims briefly and then swaps, so updates read
 *  as a soft beat instead of a jump-cut. `html` is trusted, hand-written. */
export default function Explainer({ html, className = 'bit-explainer', id }) {
  const [shown, setShown] = useState(html);
  const [dim, setDim] = useState(false);

  useEffect(() => {
    if (html === shown) return undefined;
    setDim(true);
    const raf = requestAnimationFrame(() => { setShown(html); setDim(false); });
    return () => cancelAnimationFrame(raf);
  }, [html, shown]);

  return <p className={className} id={id} style={{ opacity: dim ? 0.25 : 1 }} dangerouslySetInnerHTML={{ __html: shown }} />;
}
