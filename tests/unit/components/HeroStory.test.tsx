import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroStory } from "@/app/_components/HeroStory";

describe("HeroStory", () => {
  it("renders title, meta and READ STORY CTA", () => {
    render(
      <HeroStory
        kicker="PRO × FUTURES"
        title='「俺もここで泣いた」西岡が、F級で戦う後輩へ。'
        meta="西岡良仁 × 山田翔 / 6,200字"
        href="/articles/nishioka-yamada"
      />,
    );
    expect(screen.getByText(/PRO × FUTURES/)).toBeInTheDocument();
    expect(screen.getByText(/俺もここで泣いた/)).toBeInTheDocument();
    expect(screen.getByText(/6,200字/)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /READ STORY/ });
    expect(cta).toHaveAttribute("href", "/articles/nishioka-yamada");
  });
});
