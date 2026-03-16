/**
 * OUTPUT_CommunicationPanel.tsx
 * Golf VX Marketing Dashboard — SMS / Email Communication Panel
 *
 * Features:
 *  - Tab toggle between SMS and Email modes
 *  - Recipient info display
 *  - SMS composer with 160-char segment counter
 *  - Email composer with subject line + HTML body textarea
 *  - Send button with loading state
 *  - Communication history list below composer
 *
 * File location : client/src/components/CommunicationPanel.tsx
 *
 * Props:
 *   recipientId    — DB id of the member or lead
 *   recipientType  — "member" | "lead"
 *   recipientName  — Display name
 *   recipientEmail — optional email address
 *   recipientPhone — optional phone number (E.164)
 *
 * Dependencies: shadcn/ui, tRPC, React 19
 * Note: This component is embedded inside a Dialog—no DashboardLayout needed.
 */

"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  MessageSquare,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  AtSign,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RecipientType = "member" | "lead";
type Channel = "sms" | "email" | "push";
type CommStatus = "queued" | "sent" | "delivered" | "failed" | "bounced" | "opened" | "clicked";

interface CommunicationPanelProps {
  recipientId: number;
  recipientType: RecipientType;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SMS_SEGMENT_LENGTH = 160;

const STATUS_ICON: Record<CommStatus, React.ReactNode> = {
  queued:    <Clock className="h-3.5 w-3.5 text-yellow-500" />,
  sent:      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5 text-[#72B84A]" />,
  failed:    <XCircle className="h-3.5 w-3.5 text-[#E8453C]" />,
  bounced:   <XCircle className="h-3.5 w-3.5 text-[#F2DD48]" />,
  opened:    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />,
  clicked:   <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />,
};

const STATUS_LABEL: Record<CommStatus, string> = {
  queued:    "Queued",
  sent:      "Sent",
  delivered: "Delivered",
  failed:    "Failed",
  bounced:   "Bounced",
  opened:    "Opened",
  clicked:   "Clicked",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelative(createdAt: string | Date): string {
  const date = new Date(createdAt);
  const diff = (Date.now() - date.getTime()) / 1000; // seconds

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function smsSegments(text: string): number {
  return Math.max(1, Math.ceil(text.length / SMS_SEGMENT_LENGTH));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ─── Recipient Header ─────────────────────────────────────────────────────────

function RecipientHeader({
  name,
  email,
  phone,
  type,
}: {
  name: string;
  email?: string;
  phone?: string;
  type: RecipientType;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{name}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {type}
          </Badge>
        </div>
        {email && (
          <div className="flex items-center gap-1 mt-0.5">
            <AtSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────

interface HistoryItem {
  id: number;
  channel: Channel;
  subject?: string | null;
  body: string;
  status: CommStatus;
  createdAt: string | Date;
  direction: "outbound" | "inbound";
  campaignName?: string | null;
}

function HistoryItem({ item }: { item: HistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const preview = item.body.replace(/<[^>]+>/g, " ").slice(0, 120);
  const needsExpand = item.body.length > 120;

  return (
    <div className="border rounded-md p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {item.channel === "sms" ? (
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          ) : (
            <Mail className="h-3.5 w-3.5 text-purple-500" />
          )}
          <span className="text-xs font-medium capitalize">{item.channel}</span>
          {item.subject && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              — {item.subject}
            </span>
          )}
          {item.campaignName && (
            <Badge variant="secondary" className="text-xs">
              {item.campaignName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {STATUS_ICON[item.status]}
          <span className="text-xs text-muted-foreground">
            {STATUS_LABEL[item.status]}
          </span>
          <span className="text-xs text-muted-foreground">
            · {formatRelative(item.createdAt)}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {expanded ? item.body.replace(/<[^>]+>/g, " ") : preview}
        {needsExpand && !expanded && "…"}
      </div>

      {needsExpand && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-primary flex items-center gap-0.5"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Communication History ────────────────────────────────────────────────────

function CommunicationHistory({
  recipientId,
  recipientType,
  activeChannel,
}: {
  recipientId: number;
  recipientType: RecipientType;
  activeChannel?: Channel;
}) {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.communication.getHistory.useQuery({
    recipientId,
    recipientType,
    channel: activeChannel,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">History</h4>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.data.length ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No messages yet
        </p>
      ) : (
        <div className="space-y-2">
          {data.data.map((item) => (
            <HistoryItem key={item.id} item={item as HistoryItem} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS Composer
// ─────────────────────────────────────────────────────────────────────────────

function SMSComposer({
  recipientId,
  recipientType,
  recipientName,
  phone,
  onSent,
}: {
  recipientId: number;
  recipientType: RecipientType;
  recipientName: string;
  phone: string;
  onSent: () => void;
}) {
  const [body, setBody] = useState("");
  const [campaign, setCampaign] = useState("");
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const sendSMS = trpc.communication.sendSMS.useMutation({
    onSuccess: (result) => {
      setLastResult({ success: result.success, error: result.error });
      if (result.success) {
        setBody("");
        setCampaign("");
        onSent();
      }
    },
    onError: (err) => {
      setLastResult({ success: false, error: err.message });
    },
  });

  const chars = body.length;
  const segments = smsSegments(body);
  const remaining = SMS_SEGMENT_LENGTH - (chars % SMS_SEGMENT_LENGTH);

  const handleSend = () => {
    if (!body.trim()) return;
    setLastResult(null);
    sendSMS.mutate({
      recipientId,
      recipientType,
      recipientName,
      phone,
      body,
      campaignName: campaign || undefined,
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder={`Type your SMS to ${recipientName}…`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="resize-none"
        maxLength={1600}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {chars} chars · {segments} segment{segments !== 1 ? "s" : ""}
        </span>
        <span
          className={
            remaining <= 20
              ? "text-[#F2DD48] font-medium"
              : ""
          }
        >
          {remaining} remaining
        </span>
      </div>

      <Input
        placeholder="Campaign name (optional)"
        value={campaign}
        onChange={(e) => setCampaign(e.target.value)}
        className="text-sm"
      />

      {lastResult && (
        <div
          className={`text-sm p-2 rounded-md flex items-center gap-2 border ${
            lastResult.success
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {lastResult.success ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {lastResult.success ? "SMS sent successfully!" : lastResult.error}
        </div>
      )}

      <Button
        onClick={handleSend}
        disabled={!body.trim() || sendSMS.isPending}
        className="w-full"
      >
        {sendSMS.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MessageSquare className="mr-2 h-4 w-4" />
        )}
        Send SMS
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Composer
// ─────────────────────────────────────────────────────────────────────────────

function EmailComposer({
  recipientId,
  recipientType,
  recipientName,
  email,
  onSent,
}: {
  recipientId: number;
  recipientType: RecipientType;
  recipientName: string;
  email: string;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [campaign, setCampaign] = useState("");
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const sendEmail = trpc.communication.sendEmail.useMutation({
    onSuccess: (result) => {
      setLastResult({ success: result.success, error: result.error });
      if (result.success) {
        setSubject("");
        setHtmlBody("");
        setCampaign("");
        onSent();
      }
    },
    onError: (err) => {
      setLastResult({ success: false, error: err.message });
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !htmlBody.trim()) return;
    setLastResult(null);
    sendEmail.mutate({
      recipientId,
      recipientType,
      recipientName,
      email,
      subject,
      htmlBody,
      campaignName: campaign || undefined,
    });
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Subject…"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <Textarea
        placeholder={`Message body (HTML supported)…`}
        value={htmlBody}
        onChange={(e) => setHtmlBody(e.target.value)}
        rows={8}
        className="resize-none font-mono text-sm"
      />

      <Input
        placeholder="Campaign name (optional)"
        value={campaign}
        onChange={(e) => setCampaign(e.target.value)}
        className="text-sm"
      />

      {lastResult && (
        <div
          className={`text-sm p-2 rounded-md flex items-center gap-2 border ${
            lastResult.success
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {lastResult.success ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {lastResult.success
            ? "Email sent successfully!"
            : lastResult.error}
        </div>
      )}

      <Button
        onClick={handleSend}
        disabled={!subject.trim() || !htmlBody.trim() || sendEmail.isPending}
        className="w-full"
      >
        {sendEmail.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Send Email
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function CommunicationPanel({
  recipientId,
  recipientType,
  recipientName,
  recipientEmail,
  recipientPhone,
}: CommunicationPanelProps) {
  const [activeTab, setActiveTab] = useState<Channel>(
    recipientPhone ? "sms" : "email"
  );
  const [historyKey, setHistoryKey] = useState(0); // bump to force history refetch

  const canSMS = Boolean(recipientPhone);
  const canEmail = Boolean(recipientEmail);

  const handleSent = () => setHistoryKey((k) => k + 1);

  return (
    <div className="space-y-4">
      {/* ── Recipient info ── */}
      <RecipientHeader
        name={recipientName}
        email={recipientEmail}
        phone={recipientPhone}
        type={recipientType}
      />

      {/* ── Composer tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Channel)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sms" disabled={!canSMS}>
            <MessageSquare className="h-4 w-4 mr-1.5" />
            SMS
            {!canSMS && (
              <span className="ml-1 text-muted-foreground text-xs">(no phone)</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="email" disabled={!canEmail}>
            <Mail className="h-4 w-4 mr-1.5" />
            Email
            {!canEmail && (
              <span className="ml-1 text-muted-foreground text-xs">(no email)</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms" className="mt-4">
          {canSMS ? (
            <SMSComposer
              recipientId={recipientId}
              recipientType={recipientType}
              recipientName={recipientName}
              phone={recipientPhone!}
              onSent={handleSent}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No phone number on record for this contact.
            </p>
          )}
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          {canEmail ? (
            <EmailComposer
              recipientId={recipientId}
              recipientType={recipientType}
              recipientName={recipientName}
              email={recipientEmail!}
              onSent={handleSent}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No email address on record for this contact.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      {/* ── Communication history ── */}
      <CommunicationHistory
        key={historyKey}
        recipientId={recipientId}
        recipientType={recipientType}
        activeChannel={activeTab}
      />
    </div>
  );
}

export default CommunicationPanel;
