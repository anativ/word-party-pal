import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Copy, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ApiKeyCard = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reveal = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("reveal-api-key");
    setLoading(false);
    if (error || !data?.apiKey) {
      toast.error("Couldn't load the API key (admins only)");
      return;
    }
    setApiKey(data.apiKey);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> API Key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiKey ? (
          <>
            <code className="block break-all rounded-md bg-muted p-3 text-sm">{apiKey}</code>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Copied"); }}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setApiKey(null)}>
                <EyeOff className="h-4 w-4 mr-1" /> Hide
              </Button>
            </div>
          </>
        ) : (
          <Button size="sm" onClick={reveal} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
            Show API key
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
