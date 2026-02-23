import { describe, expect, it } from "vitest";
import { isAcuityConfigured, testAcuityConnection, getAppointmentTypes, getAppointments } from "./acuity";

describe("AcuityScheduling API Integration", () => {
  it("should have isAcuityConfigured function that never throws", () => {
    const result = isAcuityConfigured();
    expect(typeof result).toBe("boolean");
  });

  it("should handle testAcuityConnection gracefully when not configured", async () => {
    // Should never throw, returns false if not configured
    const isConnected = await testAcuityConnection();
    expect(typeof isConnected).toBe("boolean");
    // If not configured, should return false
    if (!isAcuityConfigured()) {
      expect(isConnected).toBe(false);
    }
  }, 10000);

  it("should handle getAppointmentTypes gracefully", async () => {
    // Should never throw, returns empty array if not configured
    const appointmentTypes = await getAppointmentTypes();
    expect(appointmentTypes).toBeDefined();
    expect(Array.isArray(appointmentTypes)).toBe(true);
    
    // If configured and has data, verify structure
    if (appointmentTypes.length > 0) {
      const firstType = appointmentTypes[0];
      expect(firstType).toHaveProperty("id");
      expect(firstType).toHaveProperty("name");
      expect(firstType).toHaveProperty("price");
    }
  }, 10000);

  it("should handle getAppointments gracefully", async () => {
    // Should never throw, returns empty array if not configured
    const appointments = await getAppointments({
      minDate: "2025-01-01",
      maxDate: "2026-12-31",
    });
    expect(appointments).toBeDefined();
    expect(Array.isArray(appointments)).toBe(true);
    
    // If configured and has data, verify structure
    if (appointments.length > 0) {
      const firstAppt = appointments[0];
      expect(firstAppt).toHaveProperty("id");
      expect(firstAppt).toHaveProperty("type");
      expect(firstAppt).toHaveProperty("amountPaid");
    }
  }, 10000);
});
