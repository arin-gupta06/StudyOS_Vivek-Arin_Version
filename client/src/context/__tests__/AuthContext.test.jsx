import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";

vi.mock("axios");

// Mock dashboard store
vi.mock("../../store/dashboardStore", () => ({
  useDashboardStore: {
    getState: () => ({ reset: vi.fn() }),
  },
}));

import { AuthProvider, useAuth } from "../AuthContext";

// Test component that exposes auth context
const TestConsumer = () => {
  const { user, login, register, logout, loading } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : "none"}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => login("test@test.com", "pass123")}>Login</button>
      <button onClick={() => register("testuser", "test@test.com", "pass123")}>
        Register
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("starts with no user when no auth hint", async () => {
    // No mantessa_logged_in in localStorage — should skip auth check
    axios.get.mockResolvedValue({ data: null });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  test("checks auth on mount when logged-in hint exists", async () => {
    localStorage.setItem("mantessa_logged_in", "true");
    axios.get.mockResolvedValue({
      data: { _id: "u1", username: "hydrated" },
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("user").textContent).toBe("hydrated");
  });

  test("login sets user and stores token", async () => {
    axios.get.mockResolvedValue({ data: null });
    axios.post.mockResolvedValue({
      data: { _id: "u1", username: "logged_in", token: "jwt-123" },
    });

    const user = userEvent.setup();

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await user.click(screen.getByText("Login"));

    expect(screen.getByTestId("user").textContent).toBe("logged_in");
    expect(localStorage.getItem("mantessa_token")).toBe("jwt-123");
    expect(localStorage.getItem("mantessa_logged_in")).toBe("true");
  });

  test("register sets user and stores token", async () => {
    axios.get.mockResolvedValue({ data: null });
    axios.post.mockResolvedValue({
      data: { _id: "u2", username: "testuser", token: "jwt-456" },
    });

    const user = userEvent.setup();

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await user.click(screen.getByText("Register"));

    expect(screen.getByTestId("user").textContent).toBe("testuser");
    expect(localStorage.getItem("mantessa_token")).toBe("jwt-456");
  });

  test("logout clears user and removes tokens", async () => {
    localStorage.setItem("mantessa_logged_in", "true");
    localStorage.setItem("mantessa_token", "jwt-old");
    axios.get.mockResolvedValue({
      data: { _id: "u1", username: "tologout" },
    });
    axios.post.mockResolvedValue({});

    const user = userEvent.setup();

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("user").textContent).toBe("tologout");

    await user.click(screen.getByText("Logout"));

    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(localStorage.getItem("mantessa_token")).toBeNull();
    expect(localStorage.getItem("mantessa_logged_in")).toBeNull();
  });

  test("clears auth on 401 during initial check", async () => {
    localStorage.setItem("mantessa_logged_in", "true");
    localStorage.setItem("mantessa_token", "expired-token");
    axios.get.mockRejectedValue({ response: { status: 401 } });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(localStorage.getItem("mantessa_logged_in")).toBeNull();
    expect(localStorage.getItem("mantessa_token")).toBeNull();
  });
});
