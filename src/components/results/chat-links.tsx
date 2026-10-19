import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHATS = [
  { label: "Claude", href: "https://claude.ai/new" },
  { label: "ChatGPT", href: "https://chatgpt.com/" },
  { label: "Gemini", href: "https://gemini.google.com/app" },
];

export function ChatLinks() {
  return (
    <>
      {CHATS.map((c) => (
        <Button key={c.label} variant="outline" className="h-9 gap-1.5" render={<a href={c.href} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
          {c.label} <ExternalLink className="size-3.5" />
        </Button>
      ))}
    </>
  );
}