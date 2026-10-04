const kinds = new Set(['note', 'tip', 'important', 'warning', 'caution', 'question']);

// Author callouts as semantic asides; labels and icons are supplied at build time.
export function renderCallouts(html) {
  return html.replace(/<aside class="callout" data-callout="([a-z]+)">([\s\S]*?)<\/aside>/g, (_, kind, body) => {
    if (!kinds.has(kind)) throw new Error(`Unknown callout type: ${kind}`);
    const label = kind[0].toUpperCase() + kind.slice(1);
    return `<aside class="callout callout-${kind}" data-callout="${kind}" aria-label="${label}"><p class="callout-title"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><use href="/assets/icons/callouts.svg#${kind}"></use></svg>${label}</p>${body}</aside>`;
  });
}
