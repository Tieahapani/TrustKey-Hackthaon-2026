import { describe, it, expect } from "vitest";
import { render, screen } from "../test-utils";
import ScreeningBadge from "@/components/ScreeningBadge";

describe("ScreeningBadge", () => {
  it("renders 'Weak Match' for score 0", () => {
    render(<ScreeningBadge score={0} />);
    expect(screen.getByText("Weak Match")).toBeInTheDocument();
  });

  it("renders 'Weak Match' for score 49", () => {
    render(<ScreeningBadge score={49} />);
    expect(screen.getByText("Weak Match")).toBeInTheDocument();
  });

  it("renders 'Fair Match' for score 50", () => {
    render(<ScreeningBadge score={50} />);
    expect(screen.getByText("Fair Match")).toBeInTheDocument();
  });

  it("renders 'Fair Match' for score 74", () => {
    render(<ScreeningBadge score={74} />);
    expect(screen.getByText("Fair Match")).toBeInTheDocument();
  });

  it("renders 'Strong Match' for score 75", () => {
    render(<ScreeningBadge score={75} />);
    expect(screen.getByText("Strong Match")).toBeInTheDocument();
  });

  it("renders 'Strong Match' for score 100", () => {
    render(<ScreeningBadge score={100} />);
    expect(screen.getByText("Strong Match")).toBeInTheDocument();
  });

  it("renders the numeric score", () => {
    render(<ScreeningBadge score={82} />);
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("hides the label when size is 'sm'", () => {
    render(<ScreeningBadge score={80} size="sm" />);
    expect(screen.queryByText("Strong Match")).not.toBeInTheDocument();
    // But the score itself should still be visible
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("shows the label when size is 'md' (default)", () => {
    render(<ScreeningBadge score={60} />);
    expect(screen.getByText("Fair Match")).toBeInTheDocument();
  });

  it("applies correct color classes for green level (score >= 75)", () => {
    const { container } = render(<ScreeningBadge score={90} />);
    const circle = container.querySelector(".bg-screening-green-bg");
    expect(circle).toBeInTheDocument();
    const label = container.querySelector(".text-screening-green");
    expect(label).toBeInTheDocument();
  });

  it("applies correct color classes for yellow level (50 <= score < 75)", () => {
    const { container } = render(<ScreeningBadge score={60} />);
    const circle = container.querySelector(".bg-screening-yellow-bg");
    expect(circle).toBeInTheDocument();
    const label = container.querySelector(".text-screening-yellow");
    expect(label).toBeInTheDocument();
  });

  it("applies correct color classes for red level (score < 50)", () => {
    const { container } = render(<ScreeningBadge score={30} />);
    const circle = container.querySelector(".bg-screening-red-bg");
    expect(circle).toBeInTheDocument();
    const label = container.querySelector(".text-screening-red");
    expect(label).toBeInTheDocument();
  });
});
