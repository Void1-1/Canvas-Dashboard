/**
 * Repeatedly applies a regex replacement until the output stabilizes.
 * This prevents nested-tag reassembly attacks where a single-pass replacement
 * leaves behind a new instance of the dangerous pattern (e.g. the input
 * "<scrip<script>t>" produces "<script>" after removing the inner tag).
 */
function repeatReplace(input: string, pattern: RegExp, replacement: string): string {
  let previous: string;
  do {
    previous = input;
    input = input.replace(pattern, replacement);
  } while (input !== previous);
  return input;
}

/**
 * Strips all HTML tags from a string, looping until stable to prevent
 * nested-tag bypass patterns. Safe for use in text-only preview contexts.
 */
export function stripHtmlTags(input: string): string {
  return repeatReplace(input, /<[^>]*>/g, '');
}

/**
 * Sanitizes HTML content from Canvas API, preserving list structures
 * while removing dangerous elements and inline color styles.
 */
export function sanitizeCanvasHtml(html: string): string {
  if (!html) return '';

  // First decode HTML entities (amp must be decoded last to avoid double-decoding)
  let sanitized = html
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

  // Strip dangerous block tags (script, iframe, object, style) including their content.
  // Using a full-block regex + multi-pass loop handles the nested-reassembly bypass:
  // e.g. "<scrip<script>…</script>t>" becomes "<script>…</script>" after pass 1,
  // which is then removed on pass 2.
  // Orphaned opening/closing tags (no matching pair) are caught by the follow-up patterns.
  for (const tag of ['script', 'iframe', 'object', 'style']) {
    sanitized = repeatReplace(sanitized, new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
    sanitized = repeatReplace(sanitized, new RegExp(`<${tag}\\b[^>]*>`, 'gi'), '');
    sanitized = repeatReplace(sanitized, new RegExp(`<\\/${tag}\\s*>`, 'gi'), '');
  }
  sanitized = repeatReplace(sanitized, /<embed\b[^>]*\/?>/gi, '');
  // Remove event handlers — matches both quoted (onclick="...") and unquoted (onclick=alert(1)) forms
  sanitized = repeatReplace(sanitized, /\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  
  // Clean up style attributes - remove color but preserve other safe styles
  // Also normalize list styles to ensure consistent rendering
  sanitized = sanitized.replace(
    /<(\w+)([^>]*?)style\s*=\s*["']([^"']*?)["']([^>]*?)>/gi,
    (_match: string, tag: string, before: string, style: string, after: string) => {
      // Remove color property from style attribute
      let cleanedStyle = style.replace(/color\s*:\s*[^;]+;?/gi, '').trim();
      
      // For list elements, remove list-style-type from inline styles
      // (we handle this in CSS for consistency)
      if (tag.toLowerCase() === 'ul' || tag.toLowerCase() === 'ol' || tag.toLowerCase() === 'li') {
        cleanedStyle = cleanedStyle
          .replace(/list-style-type\s*:\s*[^;]+;?/gi, '')
          .replace(/list-style\s*:\s*[^;]+;?/gi, '')
          .trim();
      }
      
      // Remove any trailing semicolons and clean up
      cleanedStyle = cleanedStyle.replace(/^;+|;+$/g, '').trim();
      
      if (cleanedStyle) {
        return `<${tag}${before}style="${cleanedStyle}"${after}>`;
      } else {
        // If no style left, remove the style attribute entirely
        return `<${tag}${before}${after}>`;
      }
    }
  );
  
  // Ensure list tags are properly formatted (remove any problematic attributes)
  // This helps with Canvas HTML that might have extra attributes
  sanitized = sanitized
    // Normalize ul/ol tags - ensure they're not self-closing
    .replace(/<ul\s*\/>/gi, '<ul>')
    .replace(/<ol\s*\/>/gi, '<ol>')
    // Ensure li tags are properly closed
    .replace(/<li\s*\/>/gi, '<li>');

  // Rewrite Canvas-hosted image src attributes to go through the server-side proxy.
  // Canvas file attachment URLs (e.g. /courses/X/files/Y or https://school.instructure.com/...)
  // are auth-gated and cannot be loaded directly in the browser.
  sanitized = sanitized.replace(
    /<img([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
    (_match: string, before: string, src: string, after: string) => {
      const isCanvasUrl = (() => {
        if (src.startsWith('/courses/') || src.startsWith('/files/') || src.startsWith('/users/')) {
          return true;
        }
        try {
          const { hostname } = new URL(src);
          return hostname === 'instructure.com' || hostname.endsWith('.instructure.com');
        } catch {
          return false;
        }
      })();
      if (!isCanvasUrl) return _match;
      // Resolve relative paths to a placeholder — the proxy needs an absolute URL.
      // Relative Canvas paths will be proxied using NEXT_PUBLIC_BASE_URL if available.
      let absoluteSrc = src;
      if (src.startsWith('/')) {
        const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || '');
        absoluteSrc = `${base}${src}`;
      }
      const proxied = `/api/canvas-image?url=${encodeURIComponent(absoluteSrc)}`;
      return `<img${before}src="${proxied}"${after}>`;
    }
  );

  return sanitized;
}
