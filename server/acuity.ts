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
 * Check if Acuity credentials are configured
 */
export function isAcuityConfigured(): boolean {
  const userId = process.env.ACUITY_USER_ID;
  const apiKey = process.env.ACUITY_API_KEY;
  return !!userId && !!apiKey;
}

/**
 * Get AcuityScheduling API credentials from environment
 * Returns null instead of throwing when not configured
 */
function getAcuityCredentials(): { userId: string; apiKey: string } | null {
  const userId = process.env.ACUITY_USER_ID;
  const apiKey = process.env.ACUITY_API_KEY;
  
  if (!userId || !apiKey) {
    return null;
  }
  
  return { userId, apiKey };
}

/**
 * Create axios instance with AcuityScheduling authentication
 * Returns null if credentials are not configured
 */
function createAcuityClient() {
  const credentials = getAcuityCredentials();
  if (!credentials) {
    return null;
  }
  
  return axios.create({
    baseURL: ACUITY_API_BASE,
    auth: {
      username: credentials.userId,
      password: credentials.apiKey,
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
    if (!client) return false;
    const response = await client.get("/me");
    return response.status === 200;
  } catch (error) {
    console.error("[Acuity] Connection test failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Get all appointment types from AcuityScheduling
 * Returns empty array if not configured
 */
export async function getAppointmentTypes(): Promise<AcuityAppointmentType[]> {
  const client = createAcuityClient();
  if (!client) {
    console.warn("[Acuity] Not configured. Returning empty appointment types.");
    return [];
  }
  try {
    const response = await client.get<AcuityAppointmentType[]>("/appointment-types");
    return response.data;
  } catch (error) {
    console.error("[Acuity] Failed to fetch appointment types:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Get appointments with optional filters
 * Returns empty array if not configured
 */
export async function getAppointments(params?: {
  minDate?: string;
  maxDate?: string;
  appointmentTypeID?: number;
  calendarID?: number;
  canceled?: boolean;
}): Promise<AcuityAppointment[]> {
  const client = createAcuityClient();
  if (!client) {
    console.warn("[Acuity] Not configured. Returning empty appointments.");
    return [];
  }
  try {
    const response = await client.get<AcuityAppointment[]>("/appointments", { params });
    return response.data;
  } catch (error) {
    console.error("[Acuity] Failed to fetch appointments:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Get payments for a specific appointment
 */
export async function getAppointmentPayments(appointmentId: number): Promise<AcuityPayment[]> {
  const client = createAcuityClient();
  if (!client) return [];
  try {
    const response = await client.get<AcuityPayment[]>(`/appointments/${appointmentId}/payments`);
    return response.data;
  } catch (error) {
    console.error("[Acuity] Failed to fetch payments:", error instanceof Error ? error.message : error);
    return [];
  }
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
  const appointmentTypes = await getAppointmentTypes();
  if (appointmentTypes.length === 0) return [];
  
  const revenueData = await Promise.all(
    appointmentTypes.map(async (type) => {
      const revenue = await getAppointmentTypeRevenue(type.id, minDate, maxDate);
      return {
        appointmentType: type.name,
        appointmentTypeId: type.id,
        category: type.category,
        ...revenue,
      };
    })
  );

  return revenueData;
}

/**
 * Extract acquisition source from appointment forms
 */
function extractAcquisitionSource(appointment: AcuityAppointment): string {
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
  const appointments = await getAppointments({
    minDate: params?.minDate,
    maxDate: params?.maxDate,
    canceled: false,
  });

  const clinicAppointments = appointments.filter(apt => 
    apt.type.toLowerCase().includes('drive day') || 
    apt.type.toLowerCase().includes('sunday clinic') ||
    apt.type.toLowerCase().includes('public drive')
  );

  const eventsByDate = clinicAppointments.reduce((acc, apt) => {
    const eventDate = apt.date;
    if (!acc[eventDate]) {
      acc[eventDate] = [];
    }
    acc[eventDate].push(apt);
    return acc;
  }, {} as Record<string, AcuityAppointment[]>);
  
  const sourceBreakdown: Record<string, number> = {};
  clinicAppointments.forEach(apt => {
    const source = extractAcquisitionSource(apt);
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
  });

  const events = Object.entries(eventsByDate).map(([date, appts]) => {
    const totalAttendees = appts.length;
    const uniqueEmails = new Set(appts.map(a => a.email.toLowerCase()));
    const uniqueAttendees = uniqueEmails.size;
    
    const eventSourceBreakdown: Record<string, number> = {};
    appts.forEach(apt => {
      const source = extractAcquisitionSource(apt);
      eventSourceBreakdown[source] = (eventSourceBreakdown[source] || 0) + 1;
    });

    return {
      date,
      totalBookings: totalAttendees,
      uniqueAttendees,
      sourceBreakdown: eventSourceBreakdown,
      appointments: appts,
    };
  });

  const allEmails = new Set(clinicAppointments.map(a => a.email.toLowerCase()));
  const repeatAttendees = clinicAppointments.length - allEmails.size;

  return {
    events: events.sort((a, b) => a.date.localeCompare(b.date)),
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
 */
export async function getSundayClinicGoalMetrics(params?: {
  minDate?: string;
  maxDate?: string;
  memberEmails?: string[];
}) {
  const data = await getSundayClinicData(params);
  const memberEmailSet = new Set((params?.memberEmails || []).map(e => e.toLowerCase()));

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

  const memberAttendanceRate = memberEmailSet.size > 0 
    ? (memberEmailsAttended.size / memberEmailSet.size) * 100 
    : 0;

  const memberRepeatRate = memberEmailsAttended.size > 0
    ? ((memberAttendees - memberEmailsAttended.size) / memberEmailsAttended.size) * 100
    : 0;

  return {
    ...data,
    totalMembers: memberEmailSet.size,
    memberAttendees: memberEmailsAttended.size,
    memberAttendanceRate,
    memberRepeatRate,
    memberTotalBookings: memberAttendees,
    nonMemberAttendees: nonMemberEmailsAttended.size,
    nonMemberTotalBookings: nonMemberAttendees,
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
  
  if (appointment.formsText) {
    const regex = new RegExp(`${fieldNamePart}[^:]*:\\s*(.+?)(?:\\n|$)`, 'i');
    const match = appointment.formsText.match(regex);
    if (match) return match[1].trim();
  }
  
  return '';
}

/**
 * Extract acquisition source specifically for Winter Clinic
 */
function extractWinterClinicSource(appointment: AcuityAppointment): string {
  const source = extractFormField(appointment, 'how did') || 
                 extractFormField(appointment, 'how did you hear') ||
                 extractFormField(appointment, 'how did find');
  
  if (source) {
    const normalized = source.toLowerCase().trim();
    if (normalized.includes('pbga') || normalized.includes('links & tees') || normalized.includes('links and tees')) return 'PBGA Links & Tees';
    if (normalized.includes('social media') || normalized.includes('instagram') || normalized.includes('facebook')) return 'Social Media';
    if (normalized.includes('golf vx')) return 'Golf VX';
    if (normalized.includes('google') || normalized.includes('search')) return 'Google Search';
    if (normalized.includes('friend') || normalized.includes('family') || normalized.includes('referral') || normalized.includes('word of mouth')) return 'Friend / Family';
    if (normalized.includes('flyer') || normalized.includes('poster') || normalized.includes('sign')) return 'Flyer / Signage';
    return source;
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
  const appointments = await getAppointments({
    minDate: params?.minDate || '2026-01-01',
    maxDate: params?.maxDate || '2026-03-31',
    canceled: false,
  });

  const clinicAppointments = appointments.filter(apt => {
    const name = apt.type.toLowerCase();
    return name.includes('clinic') && (
      name.includes('tots') ||
      name.includes('bogey') ||
      name.includes('par shooter') ||
      name.includes('player/prep') ||
      name.includes('ladies') ||
      name.includes('co-ed') ||
      name.includes('adults & kids') ||
      name.includes('adults and kids') ||
      name.includes('morning mulligan')
    );
  });

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
    
    const source = extractWinterClinicSource(apt);
    clinicTypeMap[key].sourceBreakdown[source] = (clinicTypeMap[key].sourceBreakdown[source] || 0) + 1;
    
    const experience = extractFormField(apt, 'experience');
    if (experience) {
      clinicTypeMap[key].experienceLevels[experience] = (clinicTypeMap[key].experienceLevels[experience] || 0) + 1;
    }
    
    const ageStr = extractFormField(apt, 'age of student');
    if (ageStr) {
      const age = parseInt(ageStr);
      if (!isNaN(age)) clinicTypeMap[key].studentAges.push(age);
    }
  });

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

  const overallSourceBreakdown: Record<string, number> = {};
  clinicAppointments.forEach(apt => {
    const source = extractWinterClinicSource(apt);
    overallSourceBreakdown[source] = (overallSourceBreakdown[source] || 0) + 1;
  });

  const overallExperienceLevels: Record<string, number> = {};
  clinicAppointments.forEach(apt => {
    const experience = extractFormField(apt, 'experience');
    if (experience) {
      overallExperienceLevels[experience] = (overallExperienceLevels[experience] || 0) + 1;
    }
  });

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
