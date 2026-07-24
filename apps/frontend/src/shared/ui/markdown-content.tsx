import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ body }: { body: string }) {
  return (
    <div className="flex max-w-[72ch] flex-col gap-4 text-[15px] leading-7 text-foreground [&_>*:first-child]:mt-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mt-8 font-heading text-2xl font-bold tracking-tight">{children}</h2>,
          h2: ({ children }) => <h2 className="mt-8 font-heading text-xl font-bold tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight">{children}</h3>,
          p: ({ children }) => <p className="text-muted-foreground">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline underline-offset-4 hover:no-underline">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-4 text-muted-foreground italic">{children}</blockquote>
          ),
          code: ({ children, className }) =>
            className ? (
              <code className={`${className} block overflow-x-auto rounded-[10px] bg-secondary p-4 font-mono text-[13px]`}>{children}</code>
            ) : (
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[13px]">{children}</code>
            ),
          pre: ({ children }) => <pre className="overflow-x-auto rounded-[10px]">{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-secondary px-3 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-border px-3 py-2 text-muted-foreground">{children}</td>,
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} className="h-auto max-w-full rounded-[10px] border border-border" />
            ) : null,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
