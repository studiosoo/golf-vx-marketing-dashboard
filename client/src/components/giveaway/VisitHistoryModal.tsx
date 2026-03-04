import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, UserCheck, UserX } from "lucide-react";

interface VisitHistoryData {
  hasVisited: boolean;
  visitCount: number;
  lastVisit: Date | string | null;
  selfReported: string;
  memberStatus: boolean | string | null;
  memberTier?: string | null;
}

interface VisitHistoryModalProps {
  open: boolean;
  visitHistory: VisitHistoryData | undefined;
  onOpenChange: (open: boolean) => void;
}

export function VisitHistoryModal({ open, visitHistory, onOpenChange }: VisitHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#111111]">
            <UserCheck className="h-5 w-5 text-[#F5C72C]" /> Visit History
          </DialogTitle>
        </DialogHeader>
        {visitHistory ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-[#E0E0E0]">
              {visitHistory.hasVisited ? (
                <UserCheck className="h-8 w-8 text-[#3DB855]" />
              ) : (
                <UserX className="h-8 w-8 text-[#AAAAAA]" />
              )}
              <div>
                <p className="font-semibold text-[#111111]">
                  {visitHistory.hasVisited ? "Has visited Golf VX" : "New to Golf VX"}
                </p>
                {visitHistory.visitCount > 0 && (
                  <p className="text-sm text-[#888888]">{visitHistory.visitCount} visits recorded</p>
                )}
                {visitHistory.lastVisit && (
                  <p className="text-xs text-[#AAAAAA]">Last: {new Date(visitHistory.lastVisit).toLocaleDateString()}</p>
                )}
                <p className="text-xs text-[#AAAAAA] mt-1">Self-reported: {visitHistory.selfReported}</p>
              </div>
            </div>
            {visitHistory.memberStatus && (
              <div className="p-3 bg-[#E8F5EB] rounded-lg">
                <p className="text-sm font-medium text-[#3DB855]">Active Member</p>
                <p className="text-xs text-[#3DB855]">{visitHistory.memberTier}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#AAAAAA]" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
