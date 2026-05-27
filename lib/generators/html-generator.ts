import { marked } from 'marked'
import type { DocumentationScope, DocumentationData } from './markdown-generator'
import { generateMarkdown } from './markdown-generator'

export function generateHTML(
  scope: DocumentationScope,
  data: DocumentationData,
  erdSvg?: string
): string {
  // Generate markdown first
  const markdown = generateMarkdown(scope, data, erdSvg)

  // Convert markdown to HTML
  const contentHTML = marked.parse(markdown) as string

  // Wrap in HTML template with styling
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation - InfoMapper</title>
  <style>
    ${getHTMLStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${contentHTML}
  </div>
</body>
</html>`
}

function getHTMLStyles(): string {
  return `
    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
    }

    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #1976D2;
      border-bottom: 3px solid #1976D2;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 2em;
    }

    h2 {
      color: #424242;
      margin-top: 2em;
      margin-bottom: 1em;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
      font-size: 1.5em;
    }

    h3 {
      color: #616161;
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      font-size: 1.25em;
    }

    h4 {
      color: #757575;
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-size: 1.1em;
    }

    p {
      margin: 1em 0;
    }

    strong {
      font-weight: 600;
      color: #424242;
    }

    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.5em 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5em 0;
      background: white;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 12px 16px;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
      color: #424242;
    }

    tr:hover {
      background: #fafafa;
    }

    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9em;
      color: #d32f2f;
    }

    pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      border-left: 4px solid #1976D2;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 2em 0;
    }

    svg {
      max-width: 100%;
      height: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin: 1em 0;
      background: white;
    }

    /* Print styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 20px;
      }

      h1, h2 {
        page-break-after: avoid;
      }

      table {
        page-break-inside: avoid;
      }
    }

    /* Badges and special elements */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 0.85em;
      font-weight: 600;
      margin-left: 4px;
    }

    .badge-pk {
      background: #E3F2FD;
      color: #1976D2;
    }

    .badge-fk {
      background: #FFF3E0;
      color: #F57C00;
    }

    .badge-pii {
      background: #FFEBEE;
      color: #C62828;
    }

    /* Responsive */
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }

      .container {
        padding: 20px;
      }

      table {
        font-size: 0.9em;
      }

      th, td {
        padding: 8px 12px;
      }
    }
  `
}
