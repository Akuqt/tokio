import { useCallback, useEffect, useRef, useState } from "react";
import { useClickOutside } from "./useClickOutside";

/**
 * State for a popover rendered in a portal under its anchor. It closes on a
 * click outside the anchor and the popover, and when something else scrolls.
 */
export function usePopover(gap = 4) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const toggle = () => {
    if (!open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen(!open);
  };

  useClickOutside([anchorRef, popoverRef], close, open);

  useEffect(() => {
    if (!open) return undefined;

    // The popover doesn't follow its anchor, so close it instead.
    const onScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  return { open, toggle, close, position, anchorRef, popoverRef };
}
