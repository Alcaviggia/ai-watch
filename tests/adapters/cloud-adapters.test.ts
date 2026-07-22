// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { claudeAdapter } from '../../src/adapters/claude';
import { geminiAdapter } from '../../src/adapters/gemini';
import { grokAdapter } from '../../src/adapters/grok';
import { mistralAdapter } from '../../src/adapters/mistral';
import { perplexityAdapter } from '../../src/adapters/perplexity';
import { knownSiteId, resolveAdapter } from '../../src/adapters/resolver';

beforeEach(() => {
  Element.prototype.getBoundingClientRect = function () {
    return { top: 500, left: 0, right: 300, bottom: 540, width: 300, height: 40 } as DOMRect;
  };
});

describe('resolver', () => {
  it('maps every supported hostname to the right adapter', () => {
    expect(resolveAdapter('chatgpt.com').id).toBe('chatgpt');
    expect(resolveAdapter('claude.ai').id).toBe('claude');
    expect(resolveAdapter('gemini.google.com').id).toBe('gemini');
    expect(resolveAdapter('chat.mistral.ai').id).toBe('mistral');
    expect(resolveAdapter('www.perplexity.ai').id).toBe('perplexity');
    expect(resolveAdapter('grok.com').id).toBe('grok');
    expect(resolveAdapter('example.com').id).toBe('generic');
  });
  it('knownSiteId returns null for unknown hosts', () => {
    expect(knownSiteId('claude.ai')).toBe('claude');
    expect(knownSiteId('example.com')).toBeNull();
  });
});

describe('cloud adapters — known selectors', () => {
  it('Claude: ProseMirror + aria send button', () => {
    document.body.innerHTML = `
      <div class="ProseMirror" contenteditable="true"><p></p></div>
      <button aria-label="Send message">↑</button>`;
    const c = claudeAdapter.findComposer(document);
    expect(c?.classList.contains('ProseMirror')).toBe(true);
    expect(claudeAdapter.findSendButton(document, c!)?.getAttribute('aria-label')).toBe(
      'Send message',
    );
  });

  it('Gemini: Quill editor + send aria', () => {
    document.body.innerHTML = `
      <rich-textarea><div class="ql-editor" contenteditable="true"></div></rich-textarea>
      <button aria-label="Send message">send</button>`;
    const c = geminiAdapter.findComposer(document);
    expect(c?.classList.contains('ql-editor')).toBe(true);
    expect(geminiAdapter.findSendButton(document, c!)).not.toBeNull();
  });

  it('Perplexity: #ask-input first, legacy textarea as fallback', () => {
    document.body.innerHTML = `<div id="ask-input" contenteditable="true"></div>`;
    expect(perplexityAdapter.findComposer(document)?.id).toBe('ask-input');
    document.body.innerHTML = `<textarea placeholder="Ask anything"></textarea>`;
    expect(perplexityAdapter.findComposer(document)?.tagName).toBe('TEXTAREA');
  });

  it('Mistral and Grok degrade to generic heuristics', () => {
    document.body.innerHTML = `
      <form><textarea placeholder="Chat"></textarea><button type="submit">→</button></form>`;
    expect(mistralAdapter.findComposer(document)?.tagName).toBe('TEXTAREA');
    expect(grokAdapter.findComposer(document)?.tagName).toBe('TEXTAREA');
    const c = grokAdapter.findComposer(document)!;
    expect(grokAdapter.findSendButton(document, c)?.textContent).toBe('→');
  });
});
