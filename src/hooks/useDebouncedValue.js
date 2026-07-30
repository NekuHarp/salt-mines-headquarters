import { useEffect, useState } from "react";

/**
 * Trails `value` by `delay`, resetting the wait on every change.
 *
 * Used to keep a text filter from firing a request per keystroke: the fighter
 * table is a server-side query over thousands of rows, so typing a name
 * unthrottled would spend most of its requests on prefixes nobody wanted.
 */
export function useDebouncedValue(value, delay) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
