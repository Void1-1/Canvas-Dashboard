import { describe, it, expect } from 'vitest';
import { sanitizeCanvasHtml, stripHtmlTags } from '../../lib/sanitize';

describe('sanitizeCanvasHtml', () => {
  describe('empty/falsy input', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeCanvasHtml('')).toBe('');
    });

    it('returns empty string for null-like input', () => {
      // @ts-expect-error testing runtime behavior
      expect(sanitizeCanvasHtml(null)).toBe('');
    });
  });

  describe('HTML entity decoding', () => {
    it('decodes &amp;', () => {
      expect(sanitizeCanvasHtml('a &amp; b')).toContain('a & b');
    });

    it('decodes &lt; and &gt;', () => {
      const result = sanitizeCanvasHtml('&lt;p&gt;text&lt;/p&gt;');
      expect(result).toContain('<p>text</p>');
    });

    it('decodes &quot;', () => {
      expect(sanitizeCanvasHtml('say &quot;hello&quot;')).toContain('say "hello"');
    });

    it('decodes &nbsp;', () => {
      expect(sanitizeCanvasHtml('a&nbsp;b')).toContain('a b');
    });

    it('decodes &#39; (apostrophe)', () => {
      expect(sanitizeCanvasHtml('it&#39;s')).toContain("it's");
    });
  });

  describe('dangerous tag removal', () => {
    it('strips <script> tags and their content', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Hello</p>');
    });

    it('strips <iframe> tags', () => {
      const input = '<p>text</p><iframe src="evil.com"></iframe>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
    });

    it('strips <object> tags', () => {
      const input = '<object data="file.swf"></object>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<object');
    });

    it('strips <embed> tags', () => {
      const input = '<embed src="plugin.swf" />';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<embed');
    });

    it('removes inline event handlers (onclick, onload, etc.)', () => {
      const input = '<div onclick="alert(1)">click me</div>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('removes onmouseover event handler', () => {
      const input = '<a onmouseover="steal()">hover</a>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('onmouseover');
    });

    it('removes unquoted event handlers (onclick=alert(1))', () => {
      const input = '<div onclick=alert(1)>click me</div>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('blocks nested-tag script bypass (<scrip<script>t>)', () => {
      // A single-pass regex would remove the inner <script>...</script> and leave
      // behind a reassembled <script>alert(1)</script>.
      const input = '<scrip<script>is removed</script>t>alert(1)</script>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(1)');
    });

    it('blocks nested-tag iframe bypass', () => {
      const input = '<ifr<iframe>removed</iframe>ame src="evil.com"></iframe>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('evil.com');
    });

    it('strips <script> with type attribute', () => {
      const input = '<script type="text/javascript">alert("xss")</script>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('strips <script> case-insensitively', () => {
      const input = '<SCRIPT>evil()</SCRIPT>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('evil()');
    });

    it('strips <style> tags and their CSS content', () => {
      const input = '<style>body { background: red; } .evil { display: block; }</style><p>Safe</p>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<style');
      expect(result).not.toContain('background: red');
      expect(result).toContain('<p>Safe</p>');
    });

    it('strips <object> tags and their content', () => {
      const input = '<object data="evil.swf"><param name="src" value="evil.swf" /></object>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('<object');
      expect(result).not.toContain('evil.swf');
    });
  });

  describe('stripHtmlTags', () => {
    it('removes all HTML tags', () => {
      expect(stripHtmlTags('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    });

    it('handles nested-tag bypass pattern stably', () => {
      const result = stripHtmlTags('<<b>script>alert(1)<</b>/script>');
      expect(result).not.toContain('<script>');
    });

    it('returns plain text unchanged', () => {
      expect(stripHtmlTags('Hello world')).toBe('Hello world');
    });
  });

  describe('style attribute sanitization', () => {
    it('removes color from style attributes', () => {
      const input = '<p style="color: red; font-size: 14px;">text</p>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('color: red');
      expect(result).toContain('font-size: 14px');
    });

    it('removes list-style-type from ul/ol/li elements', () => {
      const input = '<ul style="list-style-type: disc;">items</ul>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('list-style-type');
    });

    it('removes style attribute entirely when only color remains', () => {
      const input = '<span style="color: blue;">text</span>';
      const result = sanitizeCanvasHtml(input);
      expect(result).not.toContain('style=');
    });

    it('preserves non-color style properties', () => {
      const input = '<p style="font-weight: bold; font-size: 16px;">text</p>';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('font-weight: bold');
    });
  });

  describe('list tag normalization', () => {
    it('normalizes self-closing <ul /> tags', () => {
      const result = sanitizeCanvasHtml('<ul />');
      expect(result).toContain('<ul>');
      expect(result).not.toContain('<ul />');
    });

    it('normalizes self-closing <ol /> tags', () => {
      const result = sanitizeCanvasHtml('<ol />');
      expect(result).toContain('<ol>');
      expect(result).not.toContain('<ol />');
    });

    it('normalizes self-closing <li /> tags', () => {
      const result = sanitizeCanvasHtml('<li />');
      expect(result).toContain('<li>');
      expect(result).not.toContain('<li />');
    });
  });

  describe('safe HTML passthrough', () => {
    it('preserves safe paragraph and heading tags', () => {
      const input = '<h1>Title</h1><p>Paragraph</p>';
      expect(sanitizeCanvasHtml(input)).toContain('<h1>Title</h1>');
      expect(sanitizeCanvasHtml(input)).toContain('<p>Paragraph</p>');
    });

    it('preserves anchor tags', () => {
      const input = '<a href="https://example.com">link</a>';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('<a href="https://example.com">link</a>');
    });

    it('preserves strong and em tags', () => {
      const input = '<strong>bold</strong> and <em>italic</em>';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });
  });

  describe('Canvas image proxy rewriting', () => {
    it('rewrites instructure.com image src to proxy URL', () => {
      const input = '<img src="https://school.instructure.com/courses/1/files/2/preview" alt="pic">';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('/api/canvas-image?url=');
      // The original URL is encoded inside the proxy URL — the raw src should not appear unencoded
      expect(result).not.toContain('src="https://school.instructure.com');
    });

    it('rewrites relative /courses/ image src to proxy URL', () => {
      const input = '<img src="/courses/1/files/2/preview" alt="pic">';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('/api/canvas-image?url=');
    });

    it('rewrites relative /files/ image src to proxy URL', () => {
      const input = '<img src="/files/99/download" alt="file">';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('/api/canvas-image?url=');
    });

    it('does not rewrite external non-Canvas image src', () => {
      const input = '<img src="https://example.com/photo.jpg" alt="pic">';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('https://example.com/photo.jpg');
      expect(result).not.toContain('/api/canvas-image');
    });

    it('preserves alt attribute when rewriting src', () => {
      const input = '<img src="https://school.instructure.com/files/1" alt="diagram">';
      const result = sanitizeCanvasHtml(input);
      expect(result).toContain('alt="diagram"');
    });
  });
});
