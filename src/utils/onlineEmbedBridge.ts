type OnlineActionKind = 'click' | 'input' | 'change' | 'submit';

export type OnlineGameAction = {
  id: string;
  kind: OnlineActionKind;
  selector: string;
  value?: string | boolean;
  sourceId: string;
  gameId: string;
  sentAt: number;
  authoritySeq?: number;
};

const cssEscape = (value: string) => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, ch => `\\${ch}`);
};

function selectorFor(target: Element) {
  if (target.id) return `#${cssEscape(target.id)}`;
  const parts: string[] = [];
  let current: Element | null = target;
  while (current && current !== document.documentElement && parts.length < 7) {
    let part = current.tagName.toLowerCase();
    const stableAttr =
      current.getAttribute('data-online-key') ||
      current.getAttribute('aria-label') ||
      current.getAttribute('name');
    if (stableAttr) {
      const attr = current.hasAttribute('data-online-key') ? 'data-online-key' : current.hasAttribute('aria-label') ? 'aria-label' : 'name';
      part += `[${attr}="${stableAttr.replace(/"/g, '\\"')}"]`;
      parts.unshift(part);
      break;
    }
    const parentElement: HTMLElement | null = current.parentElement;
    if (parentElement) {
      const sameTag = Array.from(parentElement.children).filter((child: Element) => child.tagName === current!.tagName);
      if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    if (current.classList.contains('app') || current.tagName.toLowerCase() === 'main') break;
    current = parentElement;
  }
  return parts.join(' > ');
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string | boolean) {
  if (element instanceof HTMLInputElement && element.type === 'checkbox') {
    element.checked = Boolean(value);
    return;
  }
  const prototype =
    element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype :
    element instanceof HTMLSelectElement ? HTMLSelectElement.prototype :
    HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  descriptor?.set?.call(element, String(value ?? ''));
}

export function installOnlineEmbedBridge(params: URLSearchParams) {
  if (params.get('onlineEmbed') !== '1') return;
  const sourceId = params.get('onlinePlayer') || 'embedded-player';
  const gameId = params.get('play') || '';
  const onlineRole = params.get('onlineRole') === 'guest' ? 'guest' : 'host';
  let replaying = false;
  const seenActions = new Set<string>();
  const pendingActions = new Map<string, OnlineGameAction>();
  const rememberAction = (id: string) => {
    seenActions.add(id);
    if (seenActions.size > 300) {
      const oldest = seenActions.values().next().value as string | undefined;
      if (oldest) seenActions.delete(oldest);
    }
  };

  const emit = (kind: OnlineActionKind, element: Element, value?: string | boolean) => {
    if (replaying || element.closest('[data-online-local="true"]')) return;
    const selector = selectorFor(element);
    if (!selector || selector.length > 320) return;
    const safeValue = typeof value === 'string' ? value.slice(0, 160) : value;
    const action: OnlineGameAction = {
      id: `${sourceId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      kind,
      selector,
      value: safeValue,
      sourceId,
      gameId,
      sentAt: Date.now(),
    };
    if (!(onlineRole === 'guest' && (kind === 'click' || kind === 'submit'))) rememberAction(action.id);
    window.parent.postMessage({ type: 'qaddha-online-action', action }, window.location.origin);
  };

  document.addEventListener('click', event => {
    const element = event.target instanceof Element ? event.target.closest('button,a,[role="button"],input[type="button"],input[type="submit"]') : null;
    if (!element || element.closest('[data-online-local="true"]')) return;
    if (onlineRole === 'guest' && !replaying) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    emit('click', element);
  }, true);

  document.addEventListener('change', event => {
    const element = event.target;
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return;
    const value = element instanceof HTMLInputElement && element.type === 'checkbox' ? element.checked : element.value;
    emit('change', element, value);
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.closest('[data-online-local="true"]')) return;
    if (onlineRole === 'guest' && !replaying) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    emit('submit', form);
  }, true);

  let inputTimer = 0;
  document.addEventListener('input', event => {
    const element = event.target;
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => {
      const value = element instanceof HTMLInputElement && element.type === 'checkbox' ? element.checked : element.value;
      emit('input', element, value);
    }, 120);
  }, true);

  const applyReplay = (action: OnlineGameAction, authoritative = false) => {
    if (action.gameId !== gameId || (!authoritative && action.sourceId === sourceId) || seenActions.has(action.id)) return true;
    const element = document.querySelector(action.selector);
    if (!element) return false;
    rememberAction(action.id);
    pendingActions.delete(action.id);
    replaying = true;
    try {
      if (action.kind === 'click') {
        (element as HTMLElement).click();
      } else if (action.kind === 'submit' && element instanceof HTMLFormElement) {
        element.requestSubmit();
      } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
        setNativeValue(element, action.value ?? '');
        element.dispatchEvent(new Event(action.kind, { bubbles: true }));
        if (action.kind === 'input') element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } finally {
      queueMicrotask(() => { replaying = false; });
    }
    return true;
  };

  const queueReplay = (action: OnlineGameAction, authoritative = false) => {
    if (applyReplay(action, authoritative)) return;
    pendingActions.set(action.id, action);
    while (pendingActions.size > 80) {
      const oldest = pendingActions.keys().next().value as string | undefined;
      if (!oldest) break;
      pendingActions.delete(oldest);
    }
  };

  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    const message = event.data as { type?: string; action?: OnlineGameAction; authoritative?: boolean } | null;
    if (message?.type !== 'qaddha-online-replay' || !message.action) return;
    queueReplay(message.action, Boolean(message.authoritative));
  });

  // React games can mutate the DOM dozens of times during a single render.
  // Do not sort and replay the queue for every mutation (including replay's own mutations).
  // Batch pending work to at most one pass per animation frame, and do nothing
  // when there are no actions waiting for a missing element.
  let replayFrame = 0;
  const flushPending = () => {
    replayFrame = 0;
    if (!pendingActions.size) return;
    const now = Date.now();
    const queued = [...pendingActions.entries()].sort(([,a],[,b]) => (a.authoritySeq ?? Number.MAX_SAFE_INTEGER) - (b.authoritySeq ?? Number.MAX_SAFE_INTEGER) || a.sentAt - b.sentAt);
    for (const [id, action] of queued) {
      if (now - action.sentAt > 60000) {
        pendingActions.delete(id);
        continue;
      }
      applyReplay(action, true);
    }
  };
  const observer = new MutationObserver(() => {
    if (!pendingActions.size || replayFrame) return;
    replayFrame = window.requestAnimationFrame(flushPending);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
