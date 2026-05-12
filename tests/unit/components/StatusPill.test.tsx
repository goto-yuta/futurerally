import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusPill } from "@/app/_components/StatusPill";

describe("StatusPill", () => {
  it("renders LIVE status with red accent", () => {
    render(<StatusPill status="live">LIVE</StatusPill>);
    const pill = screen.getByText("LIVE");
    expect(pill).toBeInTheDocument();
    expect(pill.className).toMatch(/bg-signal-red/);
  });

  it("renders WON with green text", () => {
    render(<StatusPill status="won">✓ Won</StatusPill>);
    expect(screen.getByText("✓ Won").className).toMatch(/text-signal-green/);
  });

  it("renders LOST with red text", () => {
    render(<StatusPill status="lost">✗ Lost</StatusPill>);
    expect(screen.getByText("✗ Lost").className).toMatch(/text-signal-red/);
  });

  it("renders DEFAULT with muted style", () => {
    render(<StatusPill status="default">予定</StatusPill>);
    expect(screen.getByText("予定").className).toMatch(/text-fg-muted/);
  });
});
