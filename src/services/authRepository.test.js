import {
  authRepository,
  validateLoginInput,
  validateRegisterInput,
} from "./authRepository";
import { supabase } from "../lib/supabase";

jest.mock("../lib/offlineAuth", () => ({
  signOutOffline: jest.fn(),
}));

jest.mock("../lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockUpsert = jest.fn(() => Promise.resolve({ data: null, error: null }));

describe("authRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockReturnValue({ upsert: mockUpsert });
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost" },
      writable: true,
    });
  });

  it("validates login and registration forms", () => {
    expect(validateLoginInput({ email: "bad", password: "123" })).toBe("Введите корректную почту");
    expect(validateRegisterInput({
      fullName: "Иван",
      email: "ivan@example.com",
      password: "12345678",
      confirmPassword: "87654321",
    })).toBe("Пароли не совпадают");
  });

  it("detects an existing Supabase account when signUp returns empty identities", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "fake-user", identities: [] }, session: null },
      error: null,
    });

    await expect(authRepository.register({
      fullName: "Иван",
      email: "Ivan@Example.com",
      password: "12345678",
      confirmPassword: "12345678",
    })).resolves.toMatchObject({
      ok: false,
      message: "Аккаунт с таким email уже существует. Войдите в него.",
    });
  });

  it("keeps the user on registration when email confirmation is required", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "new-user", identities: [{ id: "identity" }] }, session: null },
      error: null,
    });

    await expect(authRepository.register({
      fullName: "Иван",
      email: "ivan@example.com",
      password: "12345678",
      confirmPassword: "12345678",
    })).resolves.toMatchObject({
      ok: true,
      needsConfirmation: true,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("creates account data after a successful Supabase signup with a session", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: {
        user: { id: "new-user", email: "ivan@example.com", identities: [{ id: "identity" }] },
        session: { access_token: "token" },
      },
      error: null,
    });

    await expect(authRepository.register({
      fullName: "Иван",
      email: "ivan@example.com",
      password: "12345678",
      confirmPassword: "12345678",
    })).resolves.toMatchObject({ ok: true });
    expect(supabase.from).toHaveBeenCalledWith("focus_profiles");
    expect(supabase.from).toHaveBeenCalledWith("focus_settings");
  });
});
