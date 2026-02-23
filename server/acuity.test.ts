import { describe, expect, it } from "vitest";
import { testAcuityConnection, getAppointmentTypes, getAppointments } from "./acuity";

describe("AcuityScheduling API Integration", () => {
  it("should successfully connect to AcuityScheduling API with provided credentials", async () => {
    const isConnected = await testAcuityConnection();
    expect(isConnected).toBe(true);
  }, 10000); // 10 second timeout for API call

  it("should retrieve appointment types", async () => {
    const appointmentTypes = await getAppointmentTypes();
    expect(appointmentTypes).toBeDefined();
    expect(Array.isArray(appointmentTypes)).toBe(true);
    expect(appointmentTypes.length).toBeGreaterThan(0);
    
    // Verify structure of appointment types
    if (appointmentTypes.length > 0) {
      const firstType = appointmentTypes[0];
      expect(firstType).toHaveProperty("id");
      expect(firstType).toHaveProperty("name");
      expect(firstType).toHaveProperty("price");
    }
  }, 10000);

  it("should retrieve appointments", async () => {
    const appointments = await getAppointments({
      minDate: "2025-01-01",
      maxDate: "2026-12-31",
    });
    expect(appointments).toBeDefined();
    expect(Array.isArray(appointments)).toBe(true);
    
    // Verify structure if appointments exist
    if (appointments.length > 0) {
      const firstAppt = appointments[0];
      expect(firstAppt).toHaveProperty("id");
      expect(firstAppt).toHaveProperty("type");
      expect(firstAppt).toHaveProperty("amountPaid");
    }
  }, 10000);
});
