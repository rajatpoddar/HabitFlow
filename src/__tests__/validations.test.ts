import {
  loginSchema,
  signupSchema,
  createHabitSchema,
  alarmSchema,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = {
    name: "John Doe",
    email: "john@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts valid signup data", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      ...valid,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("confirmPassword");
  });

  it("rejects weak password (no uppercase)", () => {
    const result = signupSchema.safeParse({
      ...valid,
      password: "password1!",
      confirmPassword: "password1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = signupSchema.safeParse({ ...valid, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects name with invalid characters", () => {
    const result = signupSchema.safeParse({ ...valid, name: "John<script>" });
    expect(result.success).toBe(false);
  });
});

describe("createHabitSchema", () => {
  const valid = {
    name: "Morning Run",
    type: "good" as const,
    category: "Fitness",
    icon: "directions_run",
    color: "#005237",
    frequency: "daily" as const,
    target_per_day: 1,
    reminder_enabled: false,
  };

  it("accepts valid habit", () => {
    expect(createHabitSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid color format", () => {
    const result = createHabitSchema.safeParse({ ...valid, color: "green" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid habit type", () => {
    const result = createHabitSchema.safeParse({ ...valid, type: "neutral" });
    expect(result.success).toBe(false);
  });

  it("rejects target_per_day of 0", () => {
    const result = createHabitSchema.safeParse({ ...valid, target_per_day: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts valid reminder time", () => {
    const result = createHabitSchema.safeParse({
      ...valid,
      reminder_time: "09:30",
      reminder_enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid reminder time format", () => {
    const result = createHabitSchema.safeParse({
      ...valid,
      reminder_time: "9:30am",
    });
    expect(result.success).toBe(false);
  });
});

describe("alarmSchema", () => {
  it("accepts valid alarm", () => {
    const result = alarmSchema.safeParse({
      time: "07:00",
      label: "Wake up",
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time", () => {
    const result = alarmSchema.safeParse({
      time: "25:00",
      label: "Wake up",
      enabled: true,
    });
    expect(result.success).toBe(false);
  });
});
