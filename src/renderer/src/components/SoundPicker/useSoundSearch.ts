import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  MyInstantsSound,
} from "@/common/types";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * MyInstants search with infinite scroll. Starts with trending sounds, and
 * loads the next page when `sentinelRef` scrolls into view inside `listRef`
 * while `active`.
 */
export function useSoundSearch(active: boolean) {
  // Query of the results being shown
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sounds, setSounds] = useState<MyInstantsSound[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Latest request, so responses to older ones are ignored
  const request = useRef({ query: "", page: 1 });
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback((query: string, p: number) => {
    request.current = { query, page: p };
    setLoading(true);
    setFailed(false);
    window.api.emit(APP_EVENTS.SEARCH_SOUNDS, { query, page: p });
  }, []);

  const search = (query: string) => {
    setActiveQuery(query);
    listRef.current?.scrollTo({ top: 0 });
    load(query, 1);
  };

  useEffect(() => {
    const removeSearchSounds = window.api.on(
      APP_EVENTS_RESPONSE.SEARCH_SOUNDS,
      (res) => {
        const req = request.current;
        if (!res || res.query !== req.query || res.page !== req.page) return;

        setLoading(false);
        setPage(res.page);
        setHasNextPage(res.hasNextPage);
        setFailed(!res.success);

        setSounds((prev) => {
          if (res.page === 1) return res.data;
          const seen = new Set(prev.map((s) => s.url));
          return [...prev, ...res.data.filter((s) => !seen.has(s.url))];
        });
      },
    );

    load("", 1);

    return () => {
      removeSearchSounds();
    };
  }, [load]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !active || loading || !hasNextPage) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) load(activeQuery, page + 1);
      },
      { root: listRef.current, rootMargin: "120px" },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [active, loading, hasNextPage, activeQuery, page, load]);

  return { sounds, loading, failed, search, listRef, sentinelRef };
}
