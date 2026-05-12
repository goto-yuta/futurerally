import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EndorsementBadge } from "@/app/_components/EndorsementBadge";

describe("EndorsementBadge", () => {
  it("renders pro name with star prefix", () => {
    render(<EndorsementBadge proName="西岡良仁" />);
    expect(screen.getByText(/西岡良仁/)).toBeInTheDocument();
    expect(screen.getByText(/★/)).toBeInTheDocument();
  });

  it("uses yellow signal background", () => {
    render(<EndorsementBadge proName="添田豪" />);
    expect(screen.getByText(/添田豪/).className).toMatch(/bg-signal-yellow/);
  });
});
