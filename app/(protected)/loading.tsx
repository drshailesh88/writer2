import { Loader2 } from "lucide-react";

export default function ProtectedLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading&hellip;</p>
      </div>
    </div>
  );
}
