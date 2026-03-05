import { describe, test, expect, beforeEach } from "vitest";
import { useThemeStore } from "../themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ isDarkMode: false });
  });

  test("initial state is light mode", () => {
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  test("toggleDarkMode switches to dark", () => {
    useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(true);
  });

  test("toggleDarkMode switches back to light", () => {
    useThemeStore.setState({ isDarkMode: true });
    useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  test("double toggle returns to original state", () => {
    useThemeStore.getState().toggleDarkMode();
    useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });
});
