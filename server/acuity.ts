import axios from "axios";

const ACUITY_API_BASE = "https://acuityscheduling.com/api/v1";

interface AcuityAppointment {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  endTime: string;
  dateCreated: string;
  datetimeCreated: string;
  datetime: string;
  price: string;
  priceSold: string;
  paid: string;
  amountPaid: string;
  type: string;
  appointmentTypeID: number;
  classID: number | null;
  addonIDs: number[];
  category: string;
  duration: string;
  calendar: string;
  calendarID: number;
  certificate: string | null;
  confirmationPage: string;
  formsText: string;
  forms: any[];
  notes: string;
  timezone: string;
  calendarTimezone: string;
  canceled: boolean;
  canClientCancel: boolean;
  canClientReschedule: boolean;
  labels: any[] | null;
  location: string;
}

interface AcuityAppointmentType {
  id: number;
  active: boolean;
  name: string;
  description: string;
  duration: number;
  price: string;
  category: string;
  color: string;
  private: boolean;
  type: string;
  calendarIDs: number[];
  classSize: number | null;
  paddingBefore: number;
  paddingAfter: number;
  schedulingUrl: string;
}

interface AcuityPayment {
  id: number;
  appointmentID: number;
  amount: string;
  processor: string;
  transactionID: string;
  notes: string;
  created: string;
}

/**
 * Get AcuityScheduling API credentials from environment
 */
function getAcuityCredentials() {
  const userId = process.env.ACUITY_USER_ID;
  const apiKey = process.env.ACUITY_API_KEY;
  
  if (!userId || !apiKey) {
    throw new Error("AcuityScheduling credentials not configured");
  }
  
  return { userId, apiKey };
}

/**
 * Create axios instance with AcuityScheduling authentication
 */
function createAcuityClient() {
  const { userId, apiKey } = getAcuityCredentials();
  
  return axios.create({
    baseURL: ACUITY_API_BASE,
    auth: {
      username: userId,
      password: apiKey,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Test AcuityScheduling API connection
 */
export async function testAcuityConnection(): Promise<boolean> {
  try {
    const client = createAcuityClient();
    const response = await client.get("/me");
    return response.status === 200;
  } catch (error) {
    console.error("AcuityScheduling connection test failed:", error);
    return false;
  }
}

/**
 * Get all appointment types from AcuityScheduling
 */
export async function getAppointmentTypes(): Promise<AcuityAppointmentType[]> {
  const client = createAcuityClient();
  const response = await client.get<AcuityAppointmentType[]>("/appointment-types");
  return response.data;
}

/**
 * Get appointments with optional filters
 */
export async function getAppointments(params?: {
  minDate?: string;
  maxDate?: string;
  appointmentTypeID?: number;
  calendarID?: number;
  canceled?: boolean;
  max?: number;
}): Promise<AcuityAppointment[]> {
  const client = createAcuityClient();
  // Default max=500 to avoid Acuity's 100-record default limit cutting off older data
  const response = await client.get<AcuityAppointment[]>("/appointments", {
    params: { max: 500, ...params },
  });
  return response.data;
}

/**
 * Get payments for a specific appointment
 */
export async function getAppointmentPayments(appointmentId: number): Promise<AcuityPayment[]> {
  const client = createAcuityClient();
  const response = await client.get<AcuityPayment[]>(`/appointments/${appointmentId}/payments`);
  return response.data;
}

/**
 * Get revenue data for a specific appointment type
 */
export async function getAppointmentTypeRevenue(
  appointmentTypeID: number,
  minDate?: string,
  maxDate?: string
): Promise<{ totalRevenue: number; bookingCount: number; appointments: AcuityAppointment[] }> {
  const appointments = await getAppointments({
    appointmentTypeID,
    minDate,
    maxDate,
    canceled: false,
  });

  const totalRevenue = appointments.reduce((sum, apt) => {
    const revenue = parseFloat(apt.amountPaid || apt.priceSold || apt.price || "0");
    return sum + revenue;
  }, 0);

  return {
    totalRevenue,
    bookingCount: appointments.length,
    appointments,
  };
}

/**
 * Get all revenue data grouped by appointment type
 */
export async function getAllRevenueByType(minDate?: string, maxDate?: string) {
  // Single API call + in-memory grouping (avoids 80+ parallel requests that cause rate limiting)
  const [appointments, appointmentTypes] = await Promise.all([
    getAppointments({ minDate, maxDate, canceled: false }),
    getAppointmentTypes(),
  ]);
  // Build a map of typeId -> type info
  const typeMap: Record<number, AcuityAppointmentType> = {};
  for (const t of appointmentTypes) typeMap[t.id] = t;
  // Group appointments by type
  const grouped: Record<number, { totalRevenue: number; bookingCount: number; appointments: AcuityAppointment[] }> = {};
  for (const apt of appointments) {
    const typeId = apt.appointmentTypeID;
    if (!grouped[typeId]) grouped[typeId] = { totalRevenue: 0, bookingCount: 0, appointments: [] };
    const rev = parseFloat(apt.amountPaid || apt.priceSold || apt.price || '0');
    grouped[typeId].totalRevenue += rev;
    grouped[typeId].bookingCount++;
    grouped[typeId].appointments.push(apt);
  }
  // Build result array
  const revenueData = Object.entries(grouped).map(([typeIdStr, data]) => {
    const typeId = parseInt(typeIdStr);
    const typeInfo = typeMap[typeId];
    return {
      appointmentType: typeInfo?.name || `Type ${typeId}`,
      appointmentTypeId: typeId,
      category: typeInfo?.category || '',
      totalRevenue: data.totalRevenue,
      bookingCount: data.bookingCount,
      appointments: data.appointments,
    };
  });
  return revenueData;
}

/**
 * Extract acquisition source from appointment forms
 */
export function extractAcquisitionSource(appointment: AcuityAppointment): string {
  // Check forms array for "How did you hear about us?" field
  if (appointment.forms && Array.isArray(appointment.forms)) {
    for (const form of appointment.forms) {
      if (form.values) {
        for (const field of form.values) {
          if (field.name && field.name.toLowerCase().includes('how did you hear')) {
            return field.value || 'Unknown';
          }
        }
      }
    }
  }
  
  // Fallback: check formsText for common patterns
  if (appointment.formsText) {
    const text = appointment.formsText.toLowerCase();
    if (text.includes('social media')) return 'Social Media';
    if (text.includes('pbga')) return 'PBGA';
    if (text.includes('golf vx')) return 'Golf VX';
    if (text.includes('referral')) return 'Referral';
    if (text.includes('google')) return 'Google Search';
  }
  
  return 'Unknown';
}

/**
 * Get Sunday Clinic / Drive Day appointment data with member tracking
 */
export async function getSundayClinicData(params?: {
  minDate?: string;
  maxDate?: string;
}) {
  // Get all appointments for the date range
  const appointments = await getAppointments({
    minDate: params?.minDate,
    maxDate: params?.maxDate,
    canceled: false,
  });

  // Filter for Sunday Clinic / Drive Day appointments
  // Covers all variants: "Drive Day Clinic:", "Drive Day ·", "Sunday Clinic", "Public Drive"
  const clinicAppointments = appointments.filter(apt => {
    const t = apt.type.toLowerCase();
    return t.includes('drive day clinic') || 
           t.includes('drive day ·') ||
           t.includes('sunday clinic') ||
           t.includes('public drive');
  });
  
  // Helper to classify topic from appointment type name
  const getClinicTopic = (typeName: string): 'drive_day' | 'putting' | 'short_game' => {
    const t = typeName.toLowerCase();
    if (t.includes('putting') || t.includes('score low')) return 'putting';
    if (t.includes('short game') || t.includes('below the hips') || t.includes('swing below')) return 'short_game';
    return 'drive_day';
  };

  // Group appointments by date (event) and track sources
  const eventsByDate = clinicAppointments.reduce((acc, apt) => {
    const eventDate = apt.date;
    if (!acc[eventDate]) {
      acc[eventDate] = [];
    }
    acc[eventDate].push(apt);
    return acc;
  }, {} as Record<string, AcuityAppointment[]>);
  
  // Calculate source breakdown across all events
  const sourceBreakdown: Record<string, number> = {};
  clinicAppointments.forEach(apt => {
    const source = extractAcquisitionSource(apt);
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
  });

  // Calculate metrics for each event
  const events = Object.entries(eventsByDate).map(([date, appts]) => {
    const totalAttendees = appts.length;
    const uniqueEmails = new Set(appts.map(a => a.email.toLowerCase()));
    const uniqueAttendees = uniqueEmails.size;
    
    // Calculate source breakdown for this event
    const eventSourceBreakdown: Record<string, number> = {};
    appts.forEach(apt => {
      const source = extractAcquisitionSource(apt);
      eventSourceBreakdown[source] = (eventSourceBreakdown[source] || 0) + 1;
    });

    // Determine topic from appointment type names
    const topicCounts: Record<string, number> = {};
    appts.forEach(apt => {
      const topic = getClinicTopic(apt.type);
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    const dominantTopic = (Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'drive_day') as 'drive_day' | 'putting' | 'short_game';
    const topicLabel = dominantTopic === 'putting' ? 'Putting — Score Low' : dominantTopic === 'short_game' ? 'Short Game — Swing Below the Hips' : 'Driving to the Ball';

    return {
      date,
      topic: dominantTopic,
      topicLabel,
      totalBookings: totalAttendees,
      uniqueAttendees,
      sourceBreakdown: eventSourceBreakdown,
      appointments: appts,
    };
  });

  // Calculate overall metrics
  const allEmails = new Set(clinicAppointments.map(a => a.email.toLowerCase()));
  const repeatAttendees = clinicAppointments.length - allEmails.size;

  return {
    // Sort by actual date using the first appointment's datetime field (ISO format)
    // Cannot use localeCompare on "January 25, 2026" format — alphabetical order is wrong
    events: events.sort((a, b) => {
      const dateA = a.appointments[0]?.datetime ? new Date(a.appointments[0].datetime).getTime() : new Date(a.date).getTime();
      const dateB = b.appointments[0]?.datetime ? new Date(b.appointments[0].datetime).getTime() : new Date(b.date).getTime();
      return dateA - dateB;
    }),
    totalEvents: events.length,
    totalBookings: clinicAppointments.length,
    uniqueAttendees: allEmails.size,
    repeatAttendees,
    repeatRate: allEmails.size > 0 ? (repeatAttendees / allEmails.size) * 100 : 0,
    sourceBreakdown,
  };
}

/**
 * Calculate Sunday Clinic goal metrics
 * Tracks both member retention and non-member acquisition
 */
export async function getSundayClinicGoalMetrics(params?: {
  minDate?: string;
  maxDate?: string;
  memberEmails?: string[]; // List of known member emails for tracking
}) {
  const data = await getSundayClinicData(params);
  const memberEmailSet = new Set((params?.memberEmails || []).map(e => e.toLowerCase()));

  // Categorize attendees as members vs non-members
  let memberAttendees = 0;
  let nonMemberAttendees = 0;
  const memberEmailsAttended = new Set<string>();
  const nonMemberEmailsAttended = new Set<string>();

  data.events.forEach(event => {
    event.appointments.forEach(apt => {
      const email = apt.email.toLowerCase();
      if (memberEmailSet.has(email)) {
        memberAttendees++;
        memberEmailsAttended.add(email);
      } else {
        nonMemberAttendees++;
        nonMemberEmailsAttended.add(email);
      }
    });
  });

  // Calculate member retention metrics
  const memberAttendanceRate = memberEmailSet.size > 0 
    ? (memberEmailsAttended.size / memberEmailSet.size) * 100 
    : 0;

  // Calculate repeat attendance for members
  const memberRepeatRate = memberEmailsAttended.size > 0
    ? ((memberAttendees - memberEmailsAttended.size) / memberEmailsAttended.size) * 100
    : 0;

  return {
    ...data,
    // Member retention metrics
    totalMembers: memberEmailSet.size,
    memberAttendees: memberEmailsAttended.size,
    memberAttendanceRate,
    memberRepeatRate,
    memberTotalBookings: memberAttendees,
    
    // Non-member acquisition metrics
    nonMemberAttendees: nonMemberEmailsAttended.size,
    nonMemberTotalBookings: nonMemberAttendees,
    
    // Conversion potential
    conversionOpportunities: nonMemberEmailsAttended.size,
  };
}


/**
 * Extract form field value by partial name match from Acuity appointment
 */
function extractFormField(appointment: AcuityAppointment, fieldNamePart: string): string {
  if (appointment.forms && Array.isArray(appointment.forms)) {
    for (const form of appointment.forms) {
      if (form.values) {
        for (const field of form.values) {
          if (field.name && field.name.toLowerCase().includes(fieldNamePart.toLowerCase())) {
            return field.value || '';
          }
        }
      }
    }
  }
  
  // Fallback: check formsText
  if (appointment.formsText) {
    const regex = new RegExp(`${fieldNamePart}[^:]*:\\s*(.+?)(?:\\n|$)`, 'i');
    const match = appointment.formsText.match(regex);
    if (match) return match[1].trim();
  }
  
  return '';
}

/**
 * Extract acquisition source specifically for Winter Clinic
 * Uses "How did find us?" or "How did you hear" fields
 */
function extractWinterClinicSource(appointment: AcuityAppointment): string {
  // Try specific field names used in Kids Clinic Form
  const source = extractFormField(appointment, 'how did') || 
                 extractFormField(appointment, 'how did you hear') ||
                 extractFormField(appointment, 'how did find');
  
  if (source) {
    // Normalize common values
    const normalized = source.toLowerCase().trim();
    if (normalized.includes('pbga') || normalized.includes('links & tees') || normalized.includes('links and tees')) return 'PBGA Links & Tees';
    if (normalized.includes('social media') || normalized.includes('instagram') || normalized.includes('facebook')) return 'Social Media';
    if (normalized.includes('golf vx')) return 'Golf VX';
    if (normalized.includes('google') || normalized.includes('search')) return 'Google Search';
    if (normalized.includes('friend') || normalized.includes('family') || normalized.includes('referral') || normalized.includes('word of mouth')) return 'Friend / Family';
    if (normalized.includes('flyer') || normalized.includes('poster') || normalized.includes('sign')) return 'Flyer / Signage';
    return source; // Return as-is if no match
  }
  
  return 'Unknown';
}

/**
 * Categorize Winter Clinic appointment type into a group
 */
function categorizeClinicType(typeName: string): {
  category: 'kids' | 'adults' | 'family';
  ageGroup: string;
  dayOfWeek: string;
  shortName: string;
} {
  const name = typeName.toLowerCase();
  
  if (name.includes('tots') && name.includes('4-6')) {
    return { category: 'kids', ageGroup: 'Ages 4-6', dayOfWeek: 'Monday', shortName: 'Tots Clinic' };
  }
  if (name.includes('bogey') && name.includes('7-10')) {
    return { category: 'kids', ageGroup: 'Ages 7-10', dayOfWeek: 'Monday', shortName: 'Bogey Jrs' };
  }
  if (name.includes('par shooter') && name.includes('11')) {
    return { category: 'kids', ageGroup: 'Ages 11-14', dayOfWeek: 'Tuesday', shortName: 'Par Shooters' };
  }
  if (name.includes('h.s.') || name.includes('player/prep') || name.includes('12-18')) {
    return { category: 'kids', ageGroup: 'Ages 12-18', dayOfWeek: 'Tuesday', shortName: 'H.S. Player/Prep' };
  }
  if (name.includes('ladies') && name.includes('morning')) {
    return { category: 'adults', ageGroup: 'Adults', dayOfWeek: 'Wednesday', shortName: 'Ladies Only (AM)' };
  }
  if (name.includes('ladies') && name.includes('evening')) {
    return { category: 'adults', ageGroup: 'Adults', dayOfWeek: 'Wednesday', shortName: 'Ladies Only (PM)' };
  }
  if (name.includes('co-ed') && name.includes('afternoon')) {
    return { category: 'adults', ageGroup: 'Adults', dayOfWeek: 'Wednesday', shortName: 'Adult Co-Ed (PM)' };
  }
  if (name.includes('co-ed') && name.includes('evening')) {
    return { category: 'adults', ageGroup: 'Adults', dayOfWeek: 'Wednesday', shortName: 'Adult Co-Ed (Eve)' };
  }
  if (name.includes('adults & kids') || name.includes('adults and kids')) {
    const timeMatch = name.match(/(\d+:\d+\s*(?:pm|am))/i);
    const time = timeMatch ? timeMatch[1] : '';
    return { category: 'family', ageGroup: 'All Ages', dayOfWeek: 'Saturday', shortName: `Adults & Kids (${time || 'Sat'})` };
  }
  if (name.includes('morning mulligan')) {
    return { category: 'adults', ageGroup: 'Adults', dayOfWeek: 'Wednesday', shortName: 'Morning Mulligans' };
  }
  
  return { category: 'adults', ageGroup: 'Unknown', dayOfWeek: 'Unknown', shortName: typeName };
}

/**
 * Get PBGA Winter Clinic data with lesson-by-lesson breakdown
 */
export async function getWinterClinicData(params?: {
  minDate?: string;
  maxDate?: string;
}) {
  // Get all appointments for the date range
  const appointments = await getAppointments({
    minDate: params?.minDate || '2026-01-01',
    maxDate: params?.maxDate || '2026-03-31',
    canceled: false,
  });

  // Filter for Winter Clinic appointments (PBGA Winter Clinics category)
  const clinicAppointments = appointments.filter(apt => {
    const name = apt.type.toLowerCase();
    return name.includes('clinic') && (
      name.includes('tots') ||
      name.includes('bogey') ||
      name.includes('par shooter') ||
      name.includes('h.s.') ||
      name.includes('player/prep') ||
      name.includes('ladies') ||
      name.includes('co-ed') ||
      name.includes('adults & kids') ||
      name.includes('adults and kids') ||
      name.includes('morning mulligan')
    );
  });

  // Group by clinic type
  const clinicTypeMap: Record<string, {
    typeName: string;
    category: 'kids' | 'adults' | 'family';
    ageGroup: string;
    dayOfWeek: string;
    shortName: string;
    appointments: AcuityAppointment[];
    totalRevenue: number;
    sourceBreakdown: Record<string, number>;
    experienceLevels: Record<string, number>;
    studentAges: number[];
  }> = {};

  clinicAppointments.forEach(apt => {
    const typeInfo = categorizeClinicType(apt.type);
    const key = typeInfo.shortName;
    
    if (!clinicTypeMap[key]) {
      clinicTypeMap[key] = {
        typeName: apt.type,
        ...typeInfo,
        appointments: [],
        totalRevenue: 0,
        sourceBreakdown: {},
        experienceLevels: {},
        studentAges: [],
      };
    }
    
    clinicTypeMap[key].appointments.push(apt);
    clinicTypeMap[key].totalRevenue += parseFloat(apt.amountPaid || apt.priceSold || apt.price || '0');
    
    // Track acquisition source
    const source = extractWinterClinicSource(apt);
    clinicTypeMap[key].sourceBreakdown[source] = (clinicTypeMap[key].sourceBreakdown[source] || 0) + 1;
    
    // Track experience level
    const experience = extractFormField(apt, 'experience');
    if (experience) {
      clinicTypeMap[key].experienceLevels[experience] = (clinicTypeMap[key].experienceLevels[experience] || 0) + 1;
    }
    
    // Track student age
    const ageStr = extractFormField(apt, 'age of student');
    if (ageStr) {
      const age = parseInt(ageStr);
      if (!isNaN(age)) clinicTypeMap[key].studentAges.push(age);
    }
  });

  // Build clinic summaries
  const clinics = Object.values(clinicTypeMap).map(clinic => ({
    shortName: clinic.shortName,
    typeName: clinic.typeName,
    category: clinic.category,
    ageGroup: clinic.ageGroup,
    dayOfWeek: clinic.dayOfWeek,
    registrations: clinic.appointments.length,
    uniqueStudents: new Set(clinic.appointments.map(a => a.email.toLowerCase())).size,
    totalRevenue: clinic.totalRevenue,
    avgRevenuePerStudent: clinic.appointments.length > 0 ? clinic.totalRevenue / clinic.appointments.length : 0,
    sourceBreakdown: clinic.sourceBreakdown,
    experienceLevels: clinic.experienceLevels,
    avgStudentAge: clinic.studentAges.length > 0 ? clinic.studentAges.reduce((a, b) => a + b, 0) / clinic.studentAges.length : null,
  }));

  // Overall source breakdown
  const overallSourceBreakdown: Record<string, number> = {};
  clinicAppointments.forEach(apt => {
    const source = extractWinterClinicSource(apt);
    overallSourceBreakdown[source] = (overallSourceBreakdown[source] || 0) + 1;
  });

  // Overall experience level breakdown
  const overallExperienceLevels: Record<string, number> = {};
  clinicAppointments.forEach(apt => {
    const experience = extractFormField(apt, 'experience');
    if (experience) {
      overallExperienceLevels[experience] = (overallExperienceLevels[experience] || 0) + 1;
    }
  });

  // Category summary
  const categorySummary = {
    kids: clinics.filter(c => c.category === 'kids'),
    adults: clinics.filter(c => c.category === 'adults'),
    family: clinics.filter(c => c.category === 'family'),
  };

  const totalRevenue = clinicAppointments.reduce((sum, apt) => 
    sum + parseFloat(apt.amountPaid || apt.priceSold || apt.price || '0'), 0);

  const allEmails = new Set(clinicAppointments.map(a => a.email.toLowerCase()));

  return {
    clinics: clinics.sort((a, b) => b.registrations - a.registrations),
    categorySummary,
    totalRegistrations: clinicAppointments.length,
    uniqueStudents: allEmails.size,
    totalRevenue,
    overallSourceBreakdown,
    overallExperienceLevels,
  };
}

/**
 * Get PBGA Junior Summer Camp data from Acuity
 * Categories: Full-Day (Ages 7-17), Half-Day (Ages 7-17), Tots (Ages 4-6)
 */
export async function getJuniorCampData(params?: {
  minDate?: string;
  maxDate?: string;
}) {
  const appointments = await getAppointments({
    minDate: params?.minDate || '2026-06-01',
    maxDate: params?.maxDate || '2026-08-31',
    canceled: false,
  });

  // Filter for Junior Summer Camp appointments
  const campAppointments = appointments.filter(apt => {
    const cat = (apt.category || '').toLowerCase();
    const name = apt.type.toLowerCase();
    return cat.includes('summer camp') || name.includes('summer camp') || name.includes('weekly summer camp');
  });

  // Determine program track from category/name
  function getCampTrack(apt: AcuityAppointment): { track: 'full_day' | 'half_day' | 'tots'; label: string; ageGroup: string } {
    const cat = (apt.category || '').toLowerCase();
    const name = apt.type.toLowerCase();
    if (cat.includes('tots') || name.includes('tots')) {
      return { track: 'tots', label: 'Tots Program', ageGroup: 'Ages 4–6' };
    }
    if (cat.includes('half') || name.includes('half-day') || name.includes('half day')) {
      return { track: 'half_day', label: 'Half-Day Program', ageGroup: 'Ages 7–17' };
    }
    return { track: 'full_day', label: 'Full-Day Program', ageGroup: 'Ages 7–17' };
  }

  // Extract week label from appointment type name
  function extractWeek(typeName: string): string {
    const match = typeName.match(/(Jun|Jul|Aug)\s+\d+[–\-]\d+/);
    return match ? match[0] : 'TBD';
  }

  type WeekEntry = {
    week: string;
    track: string;
    label: string;
    ageGroup: string;
    registrations: number;
    revenue: number;
    participants: string[];
    howHeard: Record<string, number>;
  };

  const weekMap: Record<string, WeekEntry> = {};

  campAppointments.forEach(apt => {
    const { track, label, ageGroup } = getCampTrack(apt);
    const week = extractWeek(apt.type);
    const key = `${week}__${track}`;
    if (!weekMap[key]) {
      weekMap[key] = { week, track, label, ageGroup, registrations: 0, revenue: 0, participants: [], howHeard: {} };
    }
    weekMap[key].registrations++;
    weekMap[key].revenue += parseFloat(apt.amountPaid || apt.priceSold || apt.price || '0');
    weekMap[key].participants.push(`${apt.firstName} ${apt.lastName}`);
    const source = extractFormField(apt, 'heard') || extractFormField(apt, 'source') || 'Unknown';
    weekMap[key].howHeard[source] = (weekMap[key].howHeard[source] || 0) + 1;
  });

  const weeks = Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));

  const overallHowHeard: Record<string, number> = {};
  campAppointments.forEach(apt => {
    const source = extractFormField(apt, 'heard') || extractFormField(apt, 'source') || 'Unknown';
    overallHowHeard[source] = (overallHowHeard[source] || 0) + 1;
  });

  const totalRevenue = campAppointments.reduce((sum, apt) =>
    sum + parseFloat(apt.amountPaid || apt.priceSold || apt.price || '0'), 0);

  const allEmails = new Set(campAppointments.map(a => a.email.toLowerCase()));

  const fullDay = campAppointments.filter(a => getCampTrack(a).track === 'full_day');
  const halfDay = campAppointments.filter(a => getCampTrack(a).track === 'half_day');
  const tots = campAppointments.filter(a => getCampTrack(a).track === 'tots');

  return {
    weeks,
    trackSummary: {
      full_day: { count: fullDay.length, revenue: fullDay.reduce((s, a) => s + parseFloat(a.amountPaid || a.priceSold || a.price || '0'), 0) },
      half_day: { count: halfDay.length, revenue: halfDay.reduce((s, a) => s + parseFloat(a.amountPaid || a.priceSold || a.price || '0'), 0) },
      tots: { count: tots.length, revenue: tots.reduce((s, a) => s + parseFloat(a.amountPaid || a.priceSold || a.price || '0'), 0) },
    },
    totalRegistrations: campAppointments.length,
    uniqueParticipants: allEmails.size,
    totalRevenue,
    overallHowHeard,
  };
}
