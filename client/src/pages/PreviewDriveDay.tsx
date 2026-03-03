import { trpc } from "@/lib/trpc";
import { Calendar, Users, DollarSign, TrendingUp, Clock } from "lucide-react";

const TOPIC_LABELS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  "Drive Day": { label: "Drive Day — Driving to the Ball", icon: "🏌️", color: "#EAB308", bg: "rgba(234,179,8,0.08)" },
  "Putting": { label: "Putting: Score Low", icon: "⛳", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  "Short Game": { label: "Hitting Below the Hips", icon: "🎯", color: "#22C55E", bg: "rgba(34,197,94,0.08)" },
};

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

function formatDate(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [, month, day] = parts;
  return `${MONTH_NAMES[month] || month} ${parseInt(day)}, 2026`;
}

function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 10, minWidth: 90 }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: color || "#fff" }}>{value}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{label}</span>
    </div>
  );
}

type DateEntry = { date: string; bookings: number; paid: number; members: number; revenue: number };
type SessionEntry = { name: string; label: string; description: string; totalRegistrations: number; revenueCollected: number; dates: DateEntry[] };

export default function PreviewDriveDay() {
  const { data, isLoading } = trpc.preview.getDriveDaySessions.useQuery();

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "#EAB308", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#000" }}>VX</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>GOLF VX</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Arlington Heights</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
          📋 Drive Day Clinic — Public Summary
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>
            Sunday Clinic <span style={{ color: "#EAB308" }}>Drive Day</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
            Public drive day events · Jan 25 – Mar 29, 2026 · 6 sessions
          </p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading clinic data...
          </div>
        ) : data ? (
          <>
            {/* Overall stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 40 }}>
              <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Users size={16} color="#EAB308" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total Registered</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#EAB308" }}>{data.overall.totalRegistrations}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <DollarSign size={16} color="#22C55E" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Revenue Collected</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#22C55E" }}>${data.overall.revenueCollected.toLocaleString()}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <TrendingUp size={16} color="#3B82F6" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Paid Attendees</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800 }}>{data.overall.paidAttendees}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Members: {data.overall.memberAttendees}</div>
              </div>
            </div>

            {/* Sessions by topic */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {(data.sessions as SessionEntry[]).map((session) => {
                const topicMeta = TOPIC_LABELS[session.name] || { label: session.label, icon: "📅", color: "#EAB308", bg: "rgba(234,179,8,0.06)" };
                return (
                  <div key={session.name} style={{ background: topicMeta.bg, border: `1px solid ${topicMeta.color}22`, borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "18px 24px", borderBottom: `1px solid ${topicMeta.color}18`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{topicMeta.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: topicMeta.color }}>{topicMeta.label}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{session.description}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <StatPill label="Registered" value={session.totalRegistrations} color={topicMeta.color} />
                        <StatPill label="Revenue" value={`$${session.revenueCollected}`} color="#22C55E" />
                      </div>
                    </div>
                    <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {session.dates.map((dateEntry: DateEntry) => {
                        const isUpcoming = dateEntry.bookings === 0 && new Date(dateEntry.date + "T12:00:00") > new Date();
                        const maxBookings = Math.max(...session.dates.map((d: DateEntry) => d.bookings), 1);
                        const fillPct = Math.round((dateEntry.bookings / maxBookings) * 100);
                        return (
                          <div key={dateEntry.date} style={{
                            background: isUpcoming ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                            border: isUpcoming ? "1px dashed rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            padding: "14px 18px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: dateEntry.bookings > 0 ? 10 : 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Calendar size={14} color={isUpcoming ? "rgba(255,255,255,0.3)" : topicMeta.color} />
                                <span style={{ fontWeight: 600, fontSize: 14, color: isUpcoming ? "rgba(255,255,255,0.4)" : "#fff" }}>
                                  {formatDate(dateEntry.date)}
                                </span>
                                {isUpcoming && (
                                  <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", padding: "2px 8px", borderRadius: 20 }}>
                                    Upcoming
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                {dateEntry.bookings > 0 && (
                                  <>
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                                      Paid: <strong style={{ color: "#fff" }}>{dateEntry.paid}</strong>
                                    </span>
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                                      Members: <strong style={{ color: "#fff" }}>{dateEntry.members}</strong>
                                    </span>
                                    {dateEntry.revenue > 0 && (
                                      <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>
                                        ${dateEntry.revenue}
                                      </span>
                                    )}
                                  </>
                                )}
                                <span style={{ fontSize: 20, fontWeight: 800, color: isUpcoming ? "rgba(255,255,255,0.2)" : topicMeta.color, minWidth: 28, textAlign: "right" }}>
                                  {isUpcoming ? "—" : dateEntry.bookings}
                                </span>
                              </div>
                            </div>
                            {dateEntry.bookings > 0 && (
                              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${fillPct}%`, background: topicMeta.color, borderRadius: 4, transition: "width 0.6s ease" }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 40, padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={14} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Data synced from Acuity Scheduler · Updated in real-time · Golf VX Arlington Heights
              </span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)" }}>No data available</div>
        )}
      </div>
    </div>
  );
}
