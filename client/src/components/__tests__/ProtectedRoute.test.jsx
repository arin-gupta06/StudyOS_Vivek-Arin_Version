import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock useAuth
vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../ProtectedRoute";

const renderWithRouter = (initialRoute = "/protected") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe("ProtectedRoute", () => {
  test("renders outlet when user is authenticated", () => {
    useAuth.mockReturnValue({ user: { _id: "u1", username: "test" } });

    renderWithRouter();

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  test("redirects to /login when user is null", () => {
    useAuth.mockReturnValue({ user: null });

    renderWithRouter();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  test("redirects to /login when user is undefined", () => {
    useAuth.mockReturnValue({ user: undefined });

    renderWithRouter();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
