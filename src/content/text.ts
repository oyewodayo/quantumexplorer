/** First sentence of a lesson body, used for short tooltips and summaries. */
export function firstSentence(text: string): string {
  const m = text.match(/^[^.]*\./);
  return m ? m[0] : text;
}
