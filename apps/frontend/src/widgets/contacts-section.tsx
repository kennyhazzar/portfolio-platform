import type { Dictionary } from "@/shared/i18n/dictionary";

interface ContactItem {
  id: string;
  platform: string;
  value: string;
}

const ICON_PATHS: Record<string, string> = {
  GITHUB:
    "M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.02-.01-1.86-2.78.62-3.37-1.22-3.37-1.22-.46-1.2-1.11-1.52-1.11-1.52-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.95.68 1.92 0 1.39-.01 2.51-.01 2.85 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z",
  TELEGRAM:
    "M21.5 4.5 2.75 11.9c-1.27.5-1.26 1.2-.23 1.51l4.78 1.49 1.85 5.63c.22.6.38.84.78.84.39 0 .56-.18.77-.4l1.87-1.83 4.3 3.17c.79.44 1.36.21 1.56-.73l2.82-13.3c.3-1.2-.44-1.74-1.29-1.38ZM8.9 13.87l9.4-5.93c.44-.27.84-.12.51.18l-7.99 7.22-.31 3.36-1.61-4.83Z",
  HABR_CAREER: "M3 3h18v18H3V3Zm5.5 5v8h1.8V9.9L12 14.4l1.7-4.5V16h1.8V8h-2.4L12 11.6 10.2 8H8.5Z",
  LINKEDIN:
    "M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM3.2 8.75h3.5V21H3.2V8.75Zm5.6 0h3.36v1.68h.05c.47-.88 1.6-1.8 3.3-1.8 3.53 0 4.18 2.24 4.18 5.16V21h-3.5v-6.1c0-1.46-.03-3.33-2.03-3.33-2.04 0-2.35 1.58-2.35 3.22V21H8.8V8.75Z",
};

function ContactIcon({ platform }: { platform: string }) {
  if (platform === "EMAIL") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  const path = ICON_PATHS[platform];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d={path} />
    </svg>
  );
}

function contactHref(platform: string, value: string): string {
  if (platform === "EMAIL") return `mailto:${value}`;
  if (value.startsWith("http")) return value;
  return value;
}

export function ContactsSection({ contacts, dict }: { contacts: ContactItem[]; dict: Dictionary }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1120px] px-7">
        <h2 className="mb-7 font-heading text-2xl font-bold tracking-tight">{dict.contacts.title}</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.contacts.empty}</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {contacts.map((contact) => (
              <a
                key={contact.id}
                href={contactHref(contact.platform, contact.value)}
                target={contact.platform === "EMAIL" ? undefined : "_blank"}
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--brand-accent-soft-border)] hover:text-primary"
              >
                <ContactIcon platform={contact.platform} />
                {dict.contactPlatform[contact.platform as keyof Dictionary["contactPlatform"]] ?? contact.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
