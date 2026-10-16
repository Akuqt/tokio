import { formatList, parseList } from "@/helper/format";
import isEqual from "fast-deep-equal";
import { TextareaHTMLAttributes, useState } from "react";
import { Textarea } from "./Input";

type Props = {
  value: string[];
  onChange: (items: string[]) => void;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;

/**
 * Edits a list as comma separated text. The typed text is kept as is, so
 * "a, " isn't trimmed while typing, and replaced when the list changes from
 * outside.
 */
export function ListTextarea({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(() => formatList(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    if (!isEqual(parseList(text), value)) setText(formatList(value));
  }

  return (
    <Textarea
      {...rest}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseList(e.target.value));
      }}
    />
  );
}
