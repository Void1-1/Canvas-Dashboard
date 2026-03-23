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
  
  // Strip dangerous tags (script, iframe, object, embed, etc.)
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ""); // Remove event handlers
  
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
  
  return sanitized;
}
