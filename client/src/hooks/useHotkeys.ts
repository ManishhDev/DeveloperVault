import { useEffect, useRef } from 'react';

type Handler = (event: KeyboardEvent) => void;

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Global shortcuts. Keys look like "n", "/", "mod+k" (mod = Ctrl or ⌘).
 * Plain keys are ignored while typing in a field; "mod+" combos always fire.
 */
export function useHotkeys(bindings: Record<string, Handler>, enabled = true) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = `${mod ? 'mod+' : ''}${event.key.toLowerCase()}`;
      const handler = ref.current[key];
      if (!handler) return;
      if (!mod && (event.altKey || isTypingTarget(event.target))) return;
      // a modal dialog owns the keyboard while open
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
