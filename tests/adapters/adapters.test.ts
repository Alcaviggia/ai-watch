// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { chatgptAdapter } from '../../src/adapters/chatgpt';
import { findComposerGeneric, findSendButtonGeneric } from '../../src/adapters/generic';
import { appendToComposer, composerText } from '../../src/content/injector';

const CHATGPT_FIXTURE = `
  <main>
    <form>
      <div id="prompt-textarea" contenteditable="true"><p>Hello</p></div>
      <button data-testid="send-button" aria-label="Send prompt">Send</button>
    </form>
  </main>`;

const TEXTAREA_FIXTURE = `
  <div class="chat">
    <div class="composer-wrap">
      <textarea placeholder="Message"></textarea>
      <button type="submit">Envoyer</button>
    </div>
  </div>`;

// happy-dom returns 0-sized rects; make our visibility check pass in tests.
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function () {
    return { top: 500, left: 0, right: 300, bottom: 540, width: 300, height: 40 } as DOMRect;
  };
});

describe('chatgptAdapter', () => {
  it('finds the ProseMirror composer and the send button by known selectors', () => {
    document.body.innerHTML = CHATGPT_FIXTURE;
    const composer = chatgptAdapter.findComposer(document);
    expect(composer?.id).toBe('prompt-textarea');
    const btn = chatgptAdapter.findSendButton(document, composer!);
    expect(btn?.getAttribute('data-testid')).toBe('send-button');
  });

  it('falls back to generic heuristics when known selectors vanish (redesign)', () => {
    document.body.innerHTML = `
      <form>
        <div contenteditable="true" class="renamed-editor"></div>
        <button type="submit">Go</button>
      </form>`;
    const composer = chatgptAdapter.findComposer(document);
    expect(composer?.className).toBe('renamed-editor');
    expect(chatgptAdapter.findSendButton(document, composer!)?.textContent).toBe('Go');
  });
});

describe('generic adapter heuristics', () => {
  it('finds a textarea composer and its sibling send button', () => {
    document.body.innerHTML = TEXTAREA_FIXTURE;
    const composer = findComposerGeneric(document);
    expect(composer?.tagName).toBe('TEXTAREA');
    const btn = findSendButtonGeneric(document, composer!);
    expect(btn?.textContent).toBe('Envoyer');
  });

  it('returns null on a page with no editable element', () => {
    document.body.innerHTML = '<main><p>Nothing here</p></main>';
    expect(findComposerGeneric(document)).toBeNull();
  });
});

describe('appendToComposer', () => {
  it('appends after existing textarea content with a blank line and fires input', () => {
    document.body.innerHTML = TEXTAREA_FIXTURE;
    const ta = document.querySelector('textarea')!;
    ta.value = 'Quelle heure est-il ?';
    let inputFired = false;
    ta.addEventListener('input', () => (inputFired = true));
    appendToComposer(ta, 'Current context\nTime: 14:32');
    expect(ta.value).toBe('Quelle heure est-il ?\n\nCurrent context\nTime: 14:32');
    expect(inputFired).toBe(true);
  });

  it('replaces content directly when the textarea is empty', () => {
    document.body.innerHTML = TEXTAREA_FIXTURE;
    const ta = document.querySelector('textarea')!;
    appendToComposer(ta, '⌚ 14:32');
    expect(ta.value).toBe('⌚ 14:32');
  });

  it('appends paragraphs to a contenteditable (DOM fallback path)', () => {
    document.body.innerHTML = CHATGPT_FIXTURE;
    const editor = document.querySelector<HTMLElement>('#prompt-textarea')!;
    appendToComposer(editor, 'Current context\nTime: 14:32');
    expect(composerText(editor)).toContain('Hello');
    expect(composerText(editor)).toContain('Current context');
    expect(composerText(editor)).toContain('Time: 14:32');
    // One <p> per line, ProseMirror-compatible structure:
    expect(editor.querySelectorAll('p').length).toBeGreaterThanOrEqual(3);
  });
});
