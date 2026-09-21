type OnlineActionKind = 'click' | 'input' | 'change';

export type OnlineGameAction = {
  id: string;
  kind: OnlineActionKind;
  selector: string;
  value?: string | boolean;
  sourceId: string;
  sentAt: number;
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
    const parent = current.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(child => child.tagName === current!.tagName);
      if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    if (current.classList.contains('app') || current.tagName.toLowerCase() === 'main') break;
    current = parent;
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
  let replaying = false;

  const emit = (kind: OnlineActionKind, element: Element, value?: string | boolean) => {
    if (replaying) return;
    const selector = selectorFor(element);
    if (!selector) return;
    const action: OnlineGameAction = {
      id: `${sourceId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      kind,
      selector,
      value,
      sourceId,
      sentAt: Date.now(),
    };
    window.parent.postMessage({ type: 'qaddha-online-action', action }, window.location.origin);
  };

  document.addEventListener('click', event => {
    const element = event.target instanceof Element ? event.target.closest('button,a,[role="button"],input[type="button"],input[type="submit"]') : null;
    if (element) emit('click', element);
  }, true);

  document.addEventListener('change', event => {
    const element = event.target;
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return;
    const value = element instanceof HTMLInputElement && element.type === 'checkbox' ? element.checked : element.value;
    emit('change', element, value);
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

  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    const message = event.data as { type?: string; action?: OnlineGameAction } | null;
    if (message?.type !== 'qaddha-online-replay' || !message.action) return;
    const action = message.action;
    if (action.sourceId === sourceId) return;
    const element = document.querySelector(action.selector);
    if (!element) return;
    replaying = true;
    try {
      if (action.kind === 'click') {
        (element as HTMLElement).click();
      } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
        setNativeValue(element, action.value ?? '');
        element.dispatchEvent(new Event(action.kind, { bubbles: true }));
        if (action.kind === 'input') element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } finally {
      queueMicrotask(() => { replaying = false; });
    }
  });
}
