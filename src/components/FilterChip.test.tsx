import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FilterChip } from './FilterChip';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('FilterChip', () => {
  it('renders the label text', () => {
    render(
      <FilterChip
        active="all"
        value="all"
        label="All items"
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /all items/i }),
    ).toBeInTheDocument();
  });

  it('applies the selected class when active matches value', () => {
    render(
      <FilterChip
        active="disrupted"
        value="disrupted"
        label="Disruptions"
        onSelect={vi.fn()}
      />,
    );

    const chip = screen.getByRole('button', { name: /disruptions/i });
    expect(chip).toHaveClass('selected');
  });

  it('does not apply the selected class when active differs from value', () => {
    render(
      <FilterChip
        active="all"
        value="disrupted"
        label="Disruptions"
        onSelect={vi.fn()}
      />,
    );

    const chip = screen.getByRole('button', { name: /disruptions/i });
    expect(chip).not.toHaveClass('selected');
  });

  it('applies the alert class when alert prop is true', () => {
    render(
      <FilterChip
        active="all"
        value="disrupted"
        label="Disruptions"
        alert
        onSelect={vi.fn()}
      />,
    );

    const chip = screen.getByRole('button', { name: /disruptions/i });
    expect(chip).toHaveClass('filter-chip-alert');
  });

  it('does not apply the alert class when alert prop is false', () => {
    render(
      <FilterChip
        active="all"
        value="all"
        label="All items"
        onSelect={vi.fn()}
      />,
    );

    const chip = screen.getByRole('button', { name: /all items/i });
    expect(chip).not.toHaveClass('filter-chip-alert');
  });

  it('can be selected and alert simultaneously', () => {
    render(
      <FilterChip
        active="disrupted"
        value="disrupted"
        label="Disruptions"
        alert
        onSelect={vi.fn()}
      />,
    );

    const chip = screen.getByRole('button', { name: /disruptions/i });
    expect(chip).toHaveClass('filter-chip-alert');
    expect(chip).toHaveClass('selected');
  });

  it('calls onSelect with the chip value when clicked', () => {
    const onSelect = vi.fn();

    render(
      <FilterChip
        active="all"
        value="42"
        label="Line 42"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /line 42/i }));
    expect(onSelect).toHaveBeenCalledWith('42');
  });

  it('renders ReactNode labels (e.g. labels with formatted counts)', () => {
    render(
      <FilterChip
        active="all"
        value="disrupted"
        label={<span>Disruptions · 3</span>}
        alert
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/disruptions · 3/i)).toBeInTheDocument();
  });

  it('renders as a button element with type="button"', () => {
    render(
      <FilterChip
        active="all"
        value="sorted"
        label="Sorted"
        onSelect={vi.fn()}
      />,
    );

    const chip = screen.getByRole('button', { name: /sorted/i });
    expect(chip).toHaveAttribute('type', 'button');
  });
});
