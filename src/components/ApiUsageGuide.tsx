import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, BookOpen, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const CodeBlock = ({ code }: { code: string }) => (
  <div className="relative">
    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
      <code>{code}</code>
    </pre>
    <Button
      size="sm"
      variant="ghost"
      className="absolute right-1 top-1 h-7 px-2"
      onClick={() => {
        navigator.clipboard.writeText(code);
        toast.success("Copied");
      }}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
  </div>
);

const ENDPOINT = "POST https://woorksdbyerlkgtyvlrw.supabase.co/functions/v1/words-api";

export const ApiUsageGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setIsOpen((v) => !v)}
        >
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> How to use the API
          </CardTitle>
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-5 text-sm">
          <div className="rounded-md bg-primary/10 p-3 text-muted-foreground">
            This API is <strong className="text-foreground">100% open</strong> — no key, no signup,
            no strings attached. Free as in beer, free as in speech, free as in "please don't
            delete all our words." With great power comes great vocabulary.
          </div>

          <div className="space-y-1">
            <p className="font-semibold">1. The endpoint</p>
            <p className="text-muted-foreground">
              All requests go to this address, using <code>POST</code>:
            </p>
            <CodeBlock code={ENDPOINT} />
          </div>

          <div className="space-y-1">
            <p className="font-semibold">2. The request body</p>
            <p className="text-muted-foreground">Send a JSON with three fields:</p>
            <CodeBlock
              code={`{
  "table":  "words" | "verbs",   // which list to change
  "action": "insert" | "update" | "upsert" | "delete",
  "items":  [ ... ]              // up to 1000 items
}`}
            />
            <p className="text-muted-foreground mt-2">Item shapes:</p>
            <CodeBlock
              code={`// word
{ "english": "house", "hebrew": "בית" }

// verb
{ "hebrew": "ללכת", "past": "went", "present": "go" }`}
            />
          </div>

          <div className="space-y-1">
            <p className="font-semibold">3. What each action does</p>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              <li><strong className="text-foreground">insert</strong> — adds new items (no <code>id</code> needed).</li>
              <li><strong className="text-foreground">update</strong> — every item must include its <code>id</code>.</li>
              <li><strong className="text-foreground">upsert</strong> — items with an <code>id</code> are updated, items without are added. Best for bulk sync.</li>
              <li><strong className="text-foreground">delete</strong> — items only need their <code>id</code>.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold">4. Example: add words</p>
            <CodeBlock
              code={`curl -X POST '${ENDPOINT.split(" ").pop()}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "table": "words",
    "action": "insert",
    "items": [
      { "english": "house", "hebrew": "בית" },
      { "english": "dog", "hebrew": "כלב" }
    ]
  }'`}
            />
          </div>

          <div className="space-y-1">
            <p className="font-semibold">5. Example: bulk sync verbs</p>
            <CodeBlock
              code={`curl -X POST '${ENDPOINT.split(" ").pop()}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "table": "verbs",
    "action": "upsert",
    "items": [
      { "hebrew": "ללכת", "past": "went", "present": "go" }
    ]
  }'`}
            />
          </div>

          <div className="space-y-1">
            <p className="font-semibold">6. Responses</p>
            <p className="text-muted-foreground">
              Success returns a count of what changed:
            </p>
            <CodeBlock code={`{ "table": "words", "action": "insert", "inserted": 2, "updated": 0 }`} />
            <p className="text-muted-foreground mt-2">
              Errors: <code>400</code> bad JSON · <code>405</code> not POST · <code>500</code> server issue.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
