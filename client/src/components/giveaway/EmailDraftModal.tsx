import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailDraft {
  draft?: {
    emails?: Array<{
      subject: string;
      body: string;
      callToAction: string;
    }>;
  };
}

interface EmailDraftModalProps {
  open: boolean;
  draft: EmailDraft | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function EmailDraftModal({ open, draft, isPending, onOpenChange, onClose }: EmailDraftModalProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    const e = draft?.draft?.emails?.[0];
    if (e) {
      navigator.clipboard.writeText(`Subject: ${e.subject}\n\n${e.body}\n\nCTA: ${e.callToAction}`);
      toast({ title: "Copied!" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#111111]">
            <FileText className="h-5 w-5 text-[#F5C72C]" />
            AI Email Draft
          </DialogTitle>
        </DialogHeader>
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F5C72C]" />
            <span className="ml-3 text-[#888888] text-sm">Generating personalized email draft...</span>
          </div>
        ) : draft ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#E0E0E0] p-4 space-y-3">
              {draft.draft?.emails?.[0] ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Subject Line</p>
                    <p className="font-medium text-[#111111]">{draft.draft.emails[0].subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Body</p>
                    <div className="bg-[#F2F2F7] rounded p-3 text-sm text-[#545A60] whitespace-pre-wrap">{draft.draft.emails[0].body}</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Call to Action</p>
                    <p className="text-sm font-medium text-[#F5C72C]">{draft.draft.emails[0].callToAction}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#888888]">No draft available.</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="border-[#E0E0E0] text-[#545A60]" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" /> Copy Email
              </Button>
              <Button className="bg-[#F5C72C] hover:bg-[#e6b820] text-[#111111]" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
