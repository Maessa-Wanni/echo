import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { useCallback, useEffect, useState } from "react";

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse) // Parse Markdown content
    .use(remarkGfm) // Support GFM (GitHub Flavored Markdown)
    .use(remarkRehype) // Convert to HTML AST
    .use(rehypeStringify) // Convert HTML AST to HTML string
    .process(markdown); // Process the Markdown input

  return String(result);
}

function useCopyToRichText() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const copy = useCallback(
    async (markdown: string) => {
      const html = await markdownToHtml(markdown);

      const richText = new Blob([html], { type: "text/html" });
      const text = new Blob([markdown], { type: "text/plain" });

      const data = [
        new ClipboardItem({
          "text/html": richText,
          "text/plain": text,
        }),
      ];

      const fallBackData = new ClipboardItem({
        "text/plain": text,
      });

      navigator.clipboard.write(data).then(
        () => {
          setCopied(true);
        },
        (_e) => {
          navigator.clipboard.write([fallBackData]).catch((e) => {
            console.error("Rich text copy failed:", e);
            alert("Failed to copy. Please report this issue to the team.");
          });
        },
      );

      setCopied(true);
    },
    [setCopied],
  );

  return {
    copy,
    copied,
  };
}

export default useCopyToRichText;
