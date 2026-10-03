import { useEffect, useRef, useState } from "react";
import { Radio, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

export const LiveBroadcast = ({ userName }: { userName: string }) => {
  const [count, setCount] = useState(1);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const key = crypto.randomUUID();
    const channel = supabase.channel("live-room", {
      config: { presence: { key }, broadcast: { self: true } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Math.max(1, Object.keys(channel.presenceState()).length));
      })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        toast(`📣 ${payload.from}`, { description: payload.text, duration: 10000 });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ online_at: Date.now() });
      });
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const send = async () => {
    const msg = text.trim().slice(0, 300);
    if (!msg || !channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: { from: userName || "Someone", text: msg },
    });
    setText("");
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg gap-2"
        size="lg"
        aria-label="Live users and broadcast"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-foreground" />
        </span>
        <Radio className="h-5 w-5" />
        {count} live
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📣 Broadcast to {count} live {count === 1 ? "person" : "people"}</DialogTitle>
            <DialogDescription>Everyone on the site right now will see your message.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={300}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <Button onClick={send} disabled={!text.trim()}>
            <Send className="mr-2 h-4 w-4" /> Send to everyone
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
