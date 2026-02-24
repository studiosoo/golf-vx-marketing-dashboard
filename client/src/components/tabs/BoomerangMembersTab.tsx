/**
 * OUTPUT_BoomerangMembersTab.tsx
 * Golf VX Marketing Dashboard — Boomerang Membership Tab
 *
 * Features:
 *  - Summary stat cards (Total, Active, Inactive, Deleted)
 *  - Member table with Name, Email, Phone, Card Status, Last Activity
 *  - Sync button to pull latest data from Boomerang API
 *  - Template selector (dropdown for Golf VX membership templates)
 *  - Per-row actions: View card details, Send push notification
 *  - Pagination
 *
 * File location : client/src/pages/Members.tsx  (as a tab inside existing Members page)
 * Route         : No new route needed — rendered as <Tab value="boomerang"> inside Members
 * Sidebar       : NO new sidebar item — lives inside Members > Boomerang Cards tab
 *
 * Dependencies: shadcn/ui, tRPC, React 19, DashboardLayout
 */

"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Bell,
  CreditCard,
  Users,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CardStatus = "installed" | "deleted" | "not installed";

interface MemberRow {
  id: number;
  fName: string;
  sName: string;
  email: string;
  phone: string;
  cardStatus: CardStatus;
  cardSerial: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Card status badge colors — shadcn semantic tokens only (light-theme safe)
const CARD_STATUS_CONFIG: Record<
  CardStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  installed: {
    label: "Active",
    color: "bg-primary text-primary-foreground",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  "not installed": {
    label: "Not Installed",
    color: "bg-muted text-muted-foreground border border-border",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  deleted: {
    label: "Deleted",
    color: "bg-destructive/10 text-destructive border border-destructive/20",
    icon: <Trash2 className="h-3.5 w-3.5" />,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fullName(fName: string, sName: string): string {
  return [fName, sName].filter(Boolean).join(" ");
}

function filterMembers(members: MemberRow[], search: string): MemberRow[] {
  if (!search.trim()) return members;
  const q = search.toLowerCase();
  return members.filter(
    (m) =>
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      fullName(m.fName, m.sName).toLowerCase().includes(q)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Cards
// ─────────────────────────────────────────────────────────────────────────────

interface SummaryCardsProps {
  members: MemberRow[];
  isLoading: boolean;
}

function SummaryCards({ members, isLoading }: SummaryCardsProps) {
  const total = members.length;
  const active = members.filter((m) => m.cardStatus === "installed").length;
  const notInstalled = members.filter(
    (m) => m.cardStatus === "not installed"
  ).length;
  const deleted = members.filter((m) => m.cardStatus === "deleted").length;

  // Stat card definitions — all colors use shadcn/brand tokens only
  const stats = [
    {
      title: "Total Members",
      value: total,
      icon: <Users className="h-5 w-5 text-primary" />,
      bg: "bg-primary/10",
    },
    {
      title: "Active (Card Installed)",
      value: active,
      icon: <UserCheck className="h-5 w-5 text-primary" />,
      bg: "bg-primary/20",
    },
    {
      title: "Not Installed",
      value: notInstalled,
      icon: <UserX className="h-5 w-5 text-muted-foreground" />,
      bg: "bg-muted",
    },
    {
      title: "Deleted / Inactive",
      value: deleted,
      icon: <Trash2 className="h-5 w-5 text-destructive" />,
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.title} className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {s.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg} flex-shrink-0`}>{s.icon}</div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-2xl font-bold">{s.value}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Detail Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface CardDetailDialogProps {
  serialNumber: string;
  memberName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function CardDetailDialog({
  serialNumber,
  memberName,
  open,
  onOpenChange,
}: CardDetailDialogProps) {
  const { data, isLoading } = trpc.boomerang.getCardInfo.useQuery(
    { serialNumber },
    { enabled: open && Boolean(serialNumber) }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <CreditCard className="inline h-5 w-5 mr-2 text-primary" />
            Card Details — {memberName}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !data ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No card data found for serial <code>{serialNumber}</code>
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              {Object.entries(data).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="font-medium text-muted-foreground w-40 flex-shrink-0 capitalize">
                    {k.replace(/([A-Z])/g, " $1").toLowerCase()}
                  </dt>
                  <dd className="text-foreground truncate">{String(v ?? "—")}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Push Notification Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface PushDialogProps {
  serialNumber: string;
  memberName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function PushDialog({
  serialNumber,
  memberName,
  open,
  onOpenChange,
}: PushDialogProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendPush = trpc.boomerang.sendPush.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setSent(true);
        setMessage("");
      } else {
        alert("Push failed. Check Boomerang API configuration.");
      }
    },
    onError: (err) => alert(`Push error: ${err.message}`),
  });

  const handleClose = (v: boolean) => {
    if (!v) {
      setSent(false);
      setMessage("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Bell className="inline h-5 w-5 mr-2 text-primary" />
            Push Notification — {memberName}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {sent ? (
            <div className="flex items-center gap-2 text-primary bg-primary/10 rounded-md p-3 border border-primary/20">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              Push notification sent successfully!
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Message will be delivered to the Boomerang card wallet on{" "}
                <strong>{memberName}</strong>'s device.
              </p>
              <Textarea
                placeholder="Enter your push message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={240}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/240
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              {sent ? "Close" : "Cancel"}
            </Button>
          </DialogClose>
          {!sent && (
            <Button
              onClick={() =>
                sendPush.mutate({ serialNumber, message })
              }
              disabled={!message.trim() || sendPush.isPending}
            >
              {sendPush.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Push
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Page wrapper — wraps the tab inside DashboardLayout for standalone route use
// ─────────────────────────────────────────────────────────────────────────────

// ─── Tab-only export — embed inside Members page Tabs ──────────────────────
// Usage in Members.tsx:
//   import { BoomerangMembersTab } from "@/components/tabs/BoomerangMembersTab";
//   <TabsContent value="boomerang"><BoomerangMembersTab /></TabsContent>
export function BoomerangMembersTab() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Dialog state
  const [cardDetailMember, setCardDetailMember] = useState<MemberRow | null>(null);
  const [pushMember, setPushMember] = useState<MemberRow | null>(null);

  // ── Templates query ────────────────────────────────────────────────────────
  const { data: templatesData, isLoading: templatesLoading } =
    trpc.boomerang.getTemplates.useQuery(undefined);

  // Auto-select first membership template when data loads
  React.useEffect(() => {
    if (templatesData && !selectedTemplateId && templatesData.length > 0) {
      const membership = (templatesData as any[]).find((t) => t.isMembership);
      setSelectedTemplateId((membership ?? templatesData[0]).id);
    }
  }, [templatesData]);

  // ── All members for selected template ─────────────────────────────────────
  const {
    data: membersData,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = trpc.boomerang.getAllMembers.useQuery(
    { templateId: selectedTemplateId! },
    { enabled: selectedTemplateId !== null }
  );

  // ── Sync mutation ──────────────────────────────────────────────────────────
  const syncMembers = trpc.boomerang.syncMembers.useMutation({
    onSuccess: (result) => {
      alert(
        `Sync complete!\nTotal: ${result.totalMembers}\nActive: ${result.activeMembers}\nSaved to DB: ${result.dbSynced}`
      );
      refetchMembers();
    },
    onError: (err) => alert(`Sync failed: ${err.message}`),
  });

  const isLoading = membersLoading || templatesLoading;

  // ── Client-side filter + pagination ───────────────────────────────────────
  const allMembers: MemberRow[] = (membersData as MemberRow[] | undefined) ?? [];
  const filtered = filterMembers(allMembers, search);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Boomerang Members</h2>
          <p className="text-sm text-muted-foreground">
            Digital loyalty card membership data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchMembers()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => syncMembers.mutate()}
            disabled={syncMembers.isPending}
          >
            {syncMembers.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Full Sync
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <SummaryCards members={allMembers} isLoading={isLoading} />

      {/* ── Template Selector + Search ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={selectedTemplateId?.toString() ?? ""}
          onValueChange={(v) => {
            setSelectedTemplateId(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select template…" />
          </SelectTrigger>
          <SelectContent>
            {(templatesData ?? []).map((t: any) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
                {t.isMembership && (
                  <span className="ml-2 text-xs text-primary">(Membership)</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <span className="text-sm text-muted-foreground self-center ml-auto">
          {filtered.length} of {allMembers.length} members
        </span>
      </div>

      {/* ── Table ── */}
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Card Status</TableHead>
              <TableHead>Card Serial</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  {search
                    ? "No members match your search"
                    : selectedTemplateId
                    ? "No members found for this template"
                    : "Select a template to view members"}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((member) => {
                const statusConfig =
                  CARD_STATUS_CONFIG[member.cardStatus] ??
                  CARD_STATUS_CONFIG["not installed"];

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {fullName(member.fName, member.sName) || (
                        <span className="text-muted-foreground italic">
                          Unknown
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.email || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.phone || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {member.cardSerial ? (
                        <code className="text-xs bg-muted px-1 rounded">
                          {member.cardSerial}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setCardDetailMember(member)}
                            disabled={!member.cardSerial}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            View Card Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setPushMember(member)}
                            disabled={member.cardStatus !== "installed"}
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            Send Push
                            {member.cardStatus !== "installed" && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                (inactive)
                              </span>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Card Detail Dialog ── */}
      {cardDetailMember?.cardSerial && (
        <CardDetailDialog
          serialNumber={cardDetailMember.cardSerial}
          memberName={fullName(cardDetailMember.fName, cardDetailMember.sName)}
          open={Boolean(cardDetailMember)}
          onOpenChange={(v) => !v && setCardDetailMember(null)}
        />
      )}

      {/* ── Push Notification Dialog ── */}
      {pushMember?.cardSerial && (
        <PushDialog
          serialNumber={pushMember.cardSerial}
          memberName={fullName(pushMember.fName, pushMember.sName)}
          open={Boolean(pushMember)}
          onOpenChange={(v) => !v && setPushMember(null)}
        />
      )}
    </div>
  );
}

// BoomerangMembersPage is the default export (full page with DashboardLayout)
// BoomerangMembersTab is the named export (embeddable tab component)
