import { Fragment } from "react";

/** Splits text into word spans for scroll-scrubbed reveals. Screen readers get one plain-text copy. */
export function Words({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className} data-words>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="w inline-block">{w}</span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </span>
    </span>
  );
}
