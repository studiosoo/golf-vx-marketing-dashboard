/**
 * EmailCapturesTab.tsx
 * Golf VX Marketing Dashboard — Email Leads Management Tab
 *
 * Features:
 *  - Filterable / searchable table of email captures
 *  - Source & status filter dropdowns
 *  - CSV bulk import
 *  - Per-row actions: edit status, sync to Encharge, open CommunicationPanel
 *  - Pagination
 */

import React, { useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, MoreHorizontal, Upload, RefreshCw, Mail, Phone } from "lucide-react";

import { CommunicationPanel } from "./CommunicationPanel";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SOURCES = [
  "web_form",
  "meta_lead_ad",
  "giveaway",
  "clickfunnels",
  "instagram",
  "manual_csv",
  "boomerang",
  "acuity",
  "referral",
  "walk_in",
  "other",
] as const;

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "unsubscribed",
  "bounced",
] as const;

type Source = (typeof SOURCES)[number];
type Status = (typeof STATUSES)[number];

const SOURCE_LABELS: Record<Source, string> = {
  web_form: "Web Form",
  meta_lead_ad: "Meta Lead Ad",
  giveaway: "Giveaway",
  clickfunnels: "ClickFunnels",
  instagram: "Instagram",
  manual_csv: "CSV Import",
  boomerang: "Boomerang",
  acuity: "Acuity",
  referral: "Referral",
  walk_in: "Walk-in",
  other: "Other",
};

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  unsubscribed: "bg-gray-100 text-gray-600",
  bounced: "bg-red-100 text-red-800",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(ms: number | null | undefined): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: Status;
}
function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Edit Status Dialog ───────────────────────────────────────────────────────

interface EditStatusDialogProps {
  leadId: number;
  currentStatus: Status;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

function EditStatusDialog({
  leadId,
  currentStatus,
  open,
  onOpenChange,
  onSaved,
}: EditStatusDialogProps) {
  const [status, setStatus] = useState<Status>(currentStatus);
  const updateStatus = trpc.emailCapture.updateStatus.useMutation({
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as Status)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => updateStatus.mutate({ id: leadId, status })}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CSV Import Dialog ────────────────────────────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

function ImportDialog({ open, onOpenChange, onImported }: ImportDialogProps) {
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [rawCSV, setRawCSV] = useState<string>("");
  const [source, setSource] = useState<Source>("manual_csv");
  const fileRef = useRef<HTMLInputElement>(null);

  const bulkImport = trpc.emailCapture.bulkImport.useMutation({
    onSuccess: (result) => {
      alert(`Imported ${result.inserted} leads. Skipped ${result.skipped} duplicates.`);
      onImported();
      onOpenChange(false);
      setPreview([]);
      setRawCSV("");
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawCSV(text);
      setPreview(parseCSV(text).slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const rows = parseCSV(rawCSV);
    const leads = rows
      .filter((r) => r.email)
      .map((r) => ({
        email: r.email,
        firstName: r.first_name || r.firstname || r.fname || undefined,
        lastName: r.last_name || r.lastname || r.lname || undefined,
        phone: r.phone || r.phone_number || undefined,
        source,
      }));

    if (leads.length === 0) {
      alert("No valid leads found. Make sure the CSV has an 'email' column.");
      return;
    }

    bulkImport.mutate({ leads });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Leads (CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            CSV must have an <code className="bg-muted px-1 rounded">email</code> column.
            Optional: <code className="bg-muted px-1 rounded">first_name</code>,{" "}
            <code className="bg-muted px-1 rounded">last_name</code>,{" "}
            <code className="bg-muted px-1 rounded">phone</code>
          </p>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Source
              </label>
              <Select
                value={source}
                onValueChange={(v) => setSource(v as Source)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {preview.length > 0 && (
            <div className="border rounded-md overflow-auto max-h-40">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(preview[0]).map((h) => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((v, j) => (
                        <TableCell key={j} className="text-xs py-1">{v}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground p-2">
                Showing first 5 rows of preview
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleImport}
            disabled={!rawCSV || bulkImport.isPending}
          >
            {bulkImport.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function EmailCapturesTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  // Dialog state
  const [editStatusLead, setEditStatusLead] = useState<{
    id: number;
    status: Status;
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [commPanelLead, setCommPanelLead] = useState<{
    id: number;
    type: "member" | "lead";
    name: string;
    email?: string;
    phone?: string;
  } | null>(null);

  // Debounce search input
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const { data, isLoading, refetch } = trpc.emailCapture.list.useQuery({
    page,
    limit: 50,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const syncToEncharge = trpc.emailCapture.syncToEncharge.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => alert(`Sync failed: ${err.message}`),
  });

  const deleteLead = trpc.emailCapture.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDelete = useCallback(
    (id: number) => {
      if (!confirm("Delete this lead? This cannot be undone.")) return;
      deleteLead.mutate({ id });
    },
    [deleteLead]
  );

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Email Captures</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} total leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="sm:max-w-xs"
        />

        <Select
          value={sourceFilter}
          onValueChange={(v) => {
            setSourceFilter(v as Source | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {SOURCE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as Status | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Captured</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((lead: any) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-mono text-sm">{lead.email}</TableCell>
                  <TableCell>
                    {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.phone || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {SOURCE_LABELS[lead.source as Source] ?? lead.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status as Status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(lead.capturedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() =>
                            setEditStatusLead({
                              id: lead.id,
                              status: lead.status as Status,
                            })
                          }
                        >
                          Edit Status
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            syncToEncharge.mutate({ id: lead.id })
                          }
                          disabled={syncToEncharge.isPending}
                        >
                          Sync to Encharge
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {lead.email && (
                          <DropdownMenuItem
                            onClick={() =>
                              setCommPanelLead({
                                id: lead.id,
                                type: "lead",
                                name:
                                  [lead.firstName, lead.lastName]
                                    .filter(Boolean)
                                    .join(" ") || lead.email,
                                email: lead.email,
                                phone: lead.phone ?? undefined,
                              })
                            }
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                        )}

                        {lead.phone && (
                          <DropdownMenuItem
                            onClick={() =>
                              setCommPanelLead({
                                id: lead.id,
                                type: "lead",
                                name:
                                  [lead.firstName, lead.lastName]
                                    .filter(Boolean)
                                    .join(" ") || lead.email,
                                email: lead.email,
                                phone: lead.phone ?? undefined,
                              })
                            }
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            Send SMS
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(lead.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages} ({data.total} leads)
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
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      {editStatusLead && (
        <EditStatusDialog
          leadId={editStatusLead.id}
          currentStatus={editStatusLead.status}
          open={Boolean(editStatusLead)}
          onOpenChange={(v) => !v && setEditStatusLead(null)}
          onSaved={() => {
            setEditStatusLead(null);
            refetch();
          }}
        />
      )}

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => refetch()}
      />

      {commPanelLead && (
        <Dialog open={Boolean(commPanelLead)} onOpenChange={(v) => !v && setCommPanelLead(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message — {commPanelLead.name}</DialogTitle>
            </DialogHeader>
            <CommunicationPanel
              recipientId={commPanelLead.id}
              recipientType={commPanelLead.type}
              recipientName={commPanelLead.name}
              recipientEmail={commPanelLead.email}
              recipientPhone={commPanelLead.phone}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default EmailCapturesTab;
