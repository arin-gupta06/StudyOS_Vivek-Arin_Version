import { describe, test, expect, beforeEach } from "vitest";
import { useLayoutStore } from "../layoutStore";

describe("layoutStore", () => {
  beforeEach(() => {
    useLayoutStore.setState({ isRightPanelOpen: true });
  });

  test("initial state has right panel open", () => {
    expect(useLayoutStore.getState().isRightPanelOpen).toBe(true);
  });

  test("toggleRightPanel closes the panel", () => {
    useLayoutStore.getState().toggleRightPanel();
    expect(useLayoutStore.getState().isRightPanelOpen).toBe(false);
  });

  test("toggleRightPanel reopens the panel", () => {
    useLayoutStore.setState({ isRightPanelOpen: false });
    useLayoutStore.getState().toggleRightPanel();
    expect(useLayoutStore.getState().isRightPanelOpen).toBe(true);
  });

  test("setRightPanelOpen explicitly sets state", () => {
    useLayoutStore.getState().setRightPanelOpen(false);
    expect(useLayoutStore.getState().isRightPanelOpen).toBe(false);

    useLayoutStore.getState().setRightPanelOpen(true);
    expect(useLayoutStore.getState().isRightPanelOpen).toBe(true);
  });
});
