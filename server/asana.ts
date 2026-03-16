/**
 * Asana service — fetches Golf VX Marketing Master Timeline tasks
 * and creates new tasks from AI action plan recommendations.
 * Uses Asana REST API with ASANA_PAT environment variable.
 */

export const MARKETING_TIMELINE_PROJECT_ID = "1212717697638611";

// Asana campaign project GIDs → dashboard campaign IDs
export const CAMPAIGN_PROJECT_MAP: Record<string, string> = {
  "1212077269419925": "trial_conversion",
  "1212077289242708": "membership_acquisition",
  "1212080057605434": "member_retention",
  "1212077289242724": "corporate_events",
};

export const CAMPAIGN_SECTIONS: Record<string, string> = {
  "Trial Conversion Campaign": "1212717697638612",
  "Membership Acquisition campaign": "1212717697638616",
  "Member Retention + Community Flywheel": "1212717697638620",
  "Venue Display / Local Media": "1212717697638624",
};

export interface AsanaTask {
  gid: string;
  name: string;
  start_on: string | null;
  due_on: string | null;
  completed: boolean;
  resource_subtype: "default_task" | "milestone" | "custom";
  campaign: string;
  section: string;
}

function getToken(): string {
  const token = process.env.ASANA_PAT;
  if (!token) throw new Error("ASANA_PAT environment variable is not set");
  return token;
}

async function asanaGet(path: string): Promise<unknown> {
  const res = await fetch(`https://app.asana.com/api/1.0${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Asana API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function retryGet(path: string, retries = 3): Promise<unknown> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await asanaGet(path);
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message.includes("429");
      if (!isRateLimit || attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Asana retryGet: unreachable");
}

async function asanaPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`https://app.asana.com/api/1.0${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ data: body }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Asana API error ${res.status}: ${await res.text()}`);
  return res.json();
}

interface AsanaApiTask {
  gid: string;
  name: string;
  start_on?: string | null;
  due_on?: string | null;
  completed?: boolean;
  resource_subtype?: string;
  memberships?: Array<{ section?: { gid: string; name: string } }>;
}

export async function getTimelineTasks(): Promise<AsanaTask[]> {
  const optFields = "name,start_on,due_on,completed,resource_subtype,memberships.section.name,memberships.section.gid";
  const data = await asanaGet(
    `/tasks?project=${MARKETING_TIMELINE_PROJECT_ID}&opt_fields=${optFields}&limit=100`
  ) as { data: AsanaApiTask[] };

  const sectionGidToName: Record<string, string> = {};
  for (const [name, gid] of Object.entries(CAMPAIGN_SECTIONS)) {
    sectionGidToName[gid] = name;
  }

  return (data.data || []).map(t => {
    const membership = t.memberships?.[0];
    const sectionGid = membership?.section?.gid || "";
    const sectionName = membership?.section?.name || sectionGidToName[sectionGid] || "Uncategorized";
    const campaign = Object.keys(CAMPAIGN_SECTIONS).find(k =>
      sectionName.toLowerCase().includes(k.split(" ")[0].toLowerCase())
    ) || sectionName;
    return {
      gid: t.gid,
      name: t.name,
      start_on: t.start_on ?? null,
      due_on: t.due_on ?? null,
      completed: t.completed ?? false,
      resource_subtype: (t.resource_subtype as AsanaTask["resource_subtype"]) || "default_task",
      campaign,
      section: sectionName,
    };
  });
}

export async function createAsanaTask(params: {
  name: string;
  notes?: string;
  due_on?: string;
  start_on?: string;
  campaignSection?: string;
}): Promise<{ gid: string; name: string; permalink_url: string }> {
  const sectionGid = params.campaignSection ? CAMPAIGN_SECTIONS[params.campaignSection] : undefined;
  const taskBody: Record<string, unknown> = {
    name: params.name,
    projects: [MARKETING_TIMELINE_PROJECT_ID],
  };
  if (params.notes) taskBody.notes = params.notes;
  if (params.due_on) taskBody.due_on = params.due_on;
  if (params.start_on) taskBody.start_on = params.start_on;
  if (sectionGid) {
    taskBody.memberships = [{ project: MARKETING_TIMELINE_PROJECT_ID, section: sectionGid }];
  }

  const result = await asanaPost("/tasks", taskBody) as {
    data: { gid: string; name: string; permalink_url: string };
  };
  return result.data;
}

export function getProjectUrl(): string {
  return `https://app.asana.com/0/${MARKETING_TIMELINE_PROJECT_ID}/timeline`;
}

export interface AsanaProjectTask {
  gid: string;
  name: string;
  assignee: string | null;
  due_on: string | null;
  completed: boolean;
}

export async function getProjectTasks(projectGid: string): Promise<AsanaProjectTask[]> {
  const optFields = "name,assignee.name,due_on,completed";
  const data = await retryGet(
    `/projects/${projectGid}/tasks?opt_fields=${optFields}&limit=100`
  ) as { data: Array<{ gid: string; name: string; assignee?: { name: string } | null; due_on?: string | null; completed?: boolean }> };
  return (data.data || []).map(t => ({
    gid: t.gid,
    name: t.name,
    assignee: t.assignee?.name ?? null,
    due_on: t.due_on ?? null,
    completed: t.completed ?? false,
  }));
}

const BUDGET_FIELD_GID = "1212082575127819";
const SPEND_FIELD_GID  = "1212082575127824";

export async function getProjectBudget(projectGid: string): Promise<{ budget: number | null; spend: number | null }> {
  const data = await retryGet(
    `/projects/${projectGid}?opt_fields=custom_fields.gid,custom_fields.number_value`
  ) as { data: { custom_fields?: Array<{ gid: string; number_value: number | null }> } };
  const fields = data.data?.custom_fields ?? [];
  const budget = fields.find(f => f.gid === BUDGET_FIELD_GID)?.number_value ?? null;
  const spend  = fields.find(f => f.gid === SPEND_FIELD_GID)?.number_value  ?? null;
  return { budget, spend };
}

export interface AsanaMasterTimelineItem {
  id: string;
  name: string;
  category: "program" | "promotion" | "paid_ads";
  campaigns: string[];
  start: string;
  end: string;
  datesConfirmed: boolean;
  status: "active" | "planned" | "completed" | "archived" | "pending";
  kpiHint?: string;
  asanaTaskId: string;
  asanaProjectId?: string;
}

interface AsanaApiTaskFull extends AsanaApiTask {
  memberships?: Array<{
    section?: { gid: string; name: string };
    project?: { gid: string; name: string };
  }>;
  notes?: string;
}

export async function getMasterTimelineTasks(): Promise<AsanaMasterTimelineItem[]> {
  const optFields = [
    "name", "gid", "start_on", "due_on", "completed",
    "resource_subtype", "notes",
    "memberships.project.gid", "memberships.project.name",
    "memberships.section.gid", "memberships.section.name",
  ].join(",");

  const data = await retryGet(
    `/tasks?project=${MARKETING_TIMELINE_PROJECT_ID}&opt_fields=${optFields}&limit=100`
  ) as { data: AsanaApiTaskFull[] };

  const today = new Date().toISOString().slice(0, 10);

  return (data.data || []).map(t => {
    // Derive campaign IDs from project memberships
    const campaignIds = (t.memberships || [])
      .map(m => m.project?.gid ?? "")
      .filter(gid => gid !== MARKETING_TIMELINE_PROJECT_ID && CAMPAIGN_PROJECT_MAP[gid])
      .map(gid => CAMPAIGN_PROJECT_MAP[gid]);

    // Deduplicate
    const campaigns = campaignIds.filter((v, i, arr) => arr.indexOf(v) === i);

    // Fallback: use section name if no project membership mapped
    if (campaigns.length === 0) {
      const sectionName = t.memberships?.[0]?.section?.name ?? "";
      const fallback = Object.keys(CAMPAIGN_SECTIONS).find(k =>
        sectionName.toLowerCase().includes(k.split(" ")[0].toLowerCase())
      );
      if (fallback) campaigns.push(
        CAMPAIGN_PROJECT_MAP[
          Object.entries(CAMPAIGN_SECTIONS).find(([, gid]) =>
            Object.keys(CAMPAIGN_SECTIONS).indexOf(fallback) ===
            Object.keys(CAMPAIGN_SECTIONS).indexOf(fallback)
          )?.[1] ?? ""
        ] ?? "trial_conversion"
      );
    }

    const datesConfirmed = !!(t.start_on && t.due_on);

    const status: AsanaMasterTimelineItem["status"] = t.completed
      ? "completed"
      : t.start_on && t.start_on > today
        ? "planned"
        : "active";

    const category: AsanaMasterTimelineItem["category"] =
      t.resource_subtype === "milestone" ? "promotion" : "program";

    const firstNonMasterGid = (t.memberships || [])
      .map(m => m.project?.gid ?? "")
      .find(gid => gid !== MARKETING_TIMELINE_PROJECT_ID && gid !== "");

    return {
      id: t.gid,
      name: t.name,
      category,
      campaigns: campaigns.length > 0 ? campaigns : ["trial_conversion"],
      start: t.start_on ?? "",
      end: t.due_on ?? "",
      datesConfirmed,
      status,
      kpiHint: t.notes ? t.notes.slice(0, 80) : undefined,
      asanaTaskId: t.gid,
      asanaProjectId: firstNonMasterGid,
    };
  });
}
