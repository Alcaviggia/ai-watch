/**
 * Text injection into the two families of composers found in the wild:
 * plain <textarea> (React-controlled) and contenteditable rich editors
 * (ProseMirror on ChatGPT/Claude).
 */

/** Read the composer's current text. */
export function composerText(composer: HTMLElement): string {
  if (composer instanceof HTMLTextAreaElement) return composer.value;
  return composer.textContent ?? '';
}

/** React-controlled textareas ignore plain `.value =`; use the native setter. */
function setTextareaValue(el: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function moveCaretToEnd(composer: HTMLElement): void {
  composer.focus();
  const doc = composer.ownerDocument;
  const win = doc.defaultView;
  const selection = win?.getSelection();
  if (!selection) return;
  const range = doc.createRange();
  range.selectNodeContents(composer);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Append `text` (may be multi-line) at the end of the composer, separated
 * from the user's message by a blank line.
 *
 * Contenteditable strategy: execCommand('insertText') line by line with
 * insertParagraph between lines — this goes through beforeinput, which
 * ProseMirror handles natively, keeping its internal state in sync.
 * Fallback (execCommand unavailable): direct DOM append + input event;
 * ProseMirror's DOM observer re-parses the mutation.
 */
export function appendToComposer(composer: HTMLElement, text: string): void {
  if (composer instanceof HTMLTextAreaElement) {
    const current = composer.value;
    setTextareaValue(composer, current.trim() === '' ? text : `${current}\n\n${text}`);
    return;
  }

  moveCaretToEnd(composer);
  const doc = composer.ownerDocument;
  const lines = text.split('\n');
  const hasContent = (composer.textContent ?? '').trim() !== '';

  let execOk = true;
  try {
    if (hasContent) {
      execOk = doc.execCommand('insertParagraph', false) && execOk;
    }
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) execOk = doc.execCommand('insertParagraph', false) && execOk;
      const line = lines[i] ?? '';
      if (line !== '') execOk = doc.execCommand('insertText', false, line) && execOk;
    }
  } catch {
    execOk = false;
  }

  if (!execOk) {
    // DOM fallback: one <p> per line (ProseMirror-compatible structure).
    for (const line of lines) {
      const p = doc.createElement('p');
      p.textContent = line;
      composer.appendChild(p);
    }
    composer.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }
}
