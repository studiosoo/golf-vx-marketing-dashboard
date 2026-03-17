/**
 * Asana service — fetches Golf VX Marketing Master Timeline tasks
 * and creates new tasks from AI action plan recommendations.
 * Uses Asana REST API with ASANA_PAT environment variable.
 */

export const MARKETING_TIMELINE_PROJECT_ID = "1212717697638611";

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
  const data = await asanaGet(
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
  const data = await asanaGet(
    `/projects/${projectGid}?opt_fields=custom_fields.gid,custom_fields.number_value`
  ) as { data: { custom_fields?: Array<{ gid: string; number_value: number | null }> } };
  const fields = data.data?.custom_fields ?? [];
  const budget = fields.find(f => f.gid === BUDGET_FIELD_GID)?.number_value ?? null;
  const spend  = fields.find(f => f.gid === SPEND_FIELD_GID)?.number_value  ?? null;
  return { budget, spend };
}
