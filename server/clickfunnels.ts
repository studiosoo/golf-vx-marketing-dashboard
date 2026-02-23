import axios from "axios";

interface ClickFunnelsTeam {
  id: number;
  public_id: string;
  name: string;
  time_zone: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

interface ClickFunnelsWorkspace {
  id: number;
  public_id: string;
  name: string;
  team_id: number;
  created_at: string;
  updated_at: string;
}

interface ClickFunnelsFunnel {
  id: number;
  public_id: string;
  workspace_id: number;
  name: string;
  archived: boolean;
  current_path: string;
  live_mode: boolean;
  created_at: string;
  updated_at: string;
  tags?: Array<{
    id: number;
    public_id: string;
    name: string;
    color: string;
  }>;
}

interface ClickFunnelsPage {
  id: number;
  public_id: string;
  workspace_id: number;
  funnel_id: number;
  name: string;
  path: string;
  visits_count?: number;
  created_at: string;
  updated_at: string;
}

interface ClickFunnelsOrder {
  id: number;
  public_id: string;
  workspace_id: number;
  contact_id: number;
  total_amount: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface ClickFunnelsFormSubmission {
  id: number;
  public_id: string;
  form_id: number;
  contact_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get ClickFunnels API credentials from environment
 */
function getClickFunnelsCredentials() {
  const apiKey = process.env.CLICKFUNNELS_API_KEY;
  
  if (!apiKey) {
    throw new Error("ClickFunnels API key not configured");
  }
  
  return { apiKey };
}

/**
 * Create axios instance with ClickFunnels authentication
 * Note: We need to determine the subdomain from the first API call or configuration
 */
function createClickFunnelsClient(subdomain: string = "myworkspace") {
  const { apiKey } = getClickFunnelsCredentials();
  
  return axios.create({
    baseURL: `https://${subdomain}.myclickfunnels.com/api/v2`,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });
}

/**
 * Test ClickFunnels API connection
 */
export async function testClickFunnelsConnection(subdomain?: string): Promise<boolean> {
  try {
    const client = createClickFunnelsClient(subdomain);
    const response = await client.get("/teams");
    return response.status === 200;
  } catch (error) {
    console.error("ClickFunnels connection test failed:", error);
    return false;
  }
}

/**
 * Get all teams
 */
export async function getTeams(subdomain?: string): Promise<ClickFunnelsTeam[]> {
  const client = createClickFunnelsClient(subdomain);
  const response = await client.get<ClickFunnelsTeam[]>("/teams");
  return response.data;
}

/**
 * Get all workspaces for a team
 */
export async function getWorkspaces(teamId: number, subdomain?: string): Promise<ClickFunnelsWorkspace[]> {
  const client = createClickFunnelsClient(subdomain);
  const response = await client.get<ClickFunnelsWorkspace[]>(`/teams/${teamId}/workspaces`);
  return response.data;
}

/**
 * Get all funnels in a workspace
 */
export async function getFunnels(workspaceId: number, subdomain?: string): Promise<ClickFunnelsFunnel[]> {
  const client = createClickFunnelsClient(subdomain);
  const response = await client.get<ClickFunnelsFunnel[]>(`/workspaces/${workspaceId}/funnels`);
  return response.data;
}

/**
 * Get all pages in a workspace
 */
export async function getPages(workspaceId: number, subdomain?: string): Promise<ClickFunnelsPage[]> {
  const client = createClickFunnelsClient(subdomain);
  const response = await client.get<ClickFunnelsPage[]>(`/workspaces/${workspaceId}/pages`);
  return response.data;
}

/**
 * Get all orders in a workspace
 */
export async function getOrders(workspaceId: number, subdomain?: string): Promise<ClickFunnelsOrder[]> {
  const client = createClickFunnelsClient(subdomain);
  const response = await client.get<ClickFunnelsOrder[]>(`/workspaces/${workspaceId}/orders`);
  return response.data;
}

/**
 * Get visitor and conversion data for a specific funnel
 */
export async function getFunnelAnalytics(
  workspaceId: number,
  funnelId: number,
  subdomain?: string
): Promise<{
  funnelName: string;
  totalVisitors: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
}> {
  const client = createClickFunnelsClient(subdomain);
  
  // Get funnel details
  const funnelResponse = await client.get<ClickFunnelsFunnel>(`/workspaces/${workspaceId}/funnels/${funnelId}`);
  const funnel = funnelResponse.data;
  
  // Get pages for this funnel to count visitors
  const pagesResponse = await client.get<ClickFunnelsPage[]>(`/workspaces/${workspaceId}/pages`, {
    params: { filter: { funnel_id: funnelId } }
  });
  const pages = pagesResponse.data;
  
  // Sum up all page visits
  const totalVisitors = pages.reduce((sum, page) => sum + (page.visits_count || 0), 0);
  
  // Get orders (would need to filter by funnel, but API might not support this directly)
  // For now, we'll need to track this via form submissions or other means
  const totalOrders = 0; // Placeholder
  const totalRevenue = 0; // Placeholder
  
  const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;
  
  return {
    funnelName: funnel.name,
    totalVisitors,
    totalOrders,
    totalRevenue,
    conversionRate,
  };
}

/**
 * Get all funnels with their analytics data
 */
export async function getAllFunnelsAnalytics(workspaceId: number, subdomain?: string) {
  const funnels = await getFunnels(workspaceId, subdomain);
  
  const analyticsData = await Promise.all(
    funnels.map(async (funnel) => {
      try {
        const analytics = await getFunnelAnalytics(workspaceId, funnel.id, subdomain);
        return {
          funnelId: funnel.id,
          funnelPublicId: funnel.public_id,
          ...analytics,
        };
      } catch (error) {
        console.error(`Error fetching analytics for funnel ${funnel.id}:`, error);
        return {
          funnelId: funnel.id,
          funnelPublicId: funnel.public_id,
          funnelName: funnel.name,
          totalVisitors: 0,
          totalOrders: 0,
          totalRevenue: 0,
          conversionRate: 0,
        };
      }
    })
  );
  
  return analyticsData;
}
