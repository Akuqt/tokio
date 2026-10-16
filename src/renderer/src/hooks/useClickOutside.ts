import { RefObject, useEffect, useEffectEvent } from "react";

/**
 * Calls `onOutside` when a mouse press lands outside every element in `refs`,
 * while `enabled`.
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  onOutside: () => void,
  enabled = true,
) {
  const onMouseDown = useEffectEvent((event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (refs.every((ref) => !ref.current?.contains(target))) onOutside();
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (event: MouseEvent) => onMouseDown(event);
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [enabled]);
}
