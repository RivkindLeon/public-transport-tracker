import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Stop } from '../types';
import { StopCard } from './StopCard';

const centralStation: Stop = {
  id: 'stop-central',
  name: 'Central Station',
  code: '1001',
  area: 'Downtown',
  lines: ['10', '18', '42'],
  isFavorite: true,
};

const marketStreet: Stop = {
  id: 'stop-market',
  name: 'Market Street',
  code: '1002',
  area: 'Downtown',
  lines: ['10', '27'],
  isFavorite: false,
};

afterEach(() => {
  cleanup();
});

describe('StopCard', () => {
  const onSelect = vi.fn();
  const onFavoriteToggle = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the stop name and area', () => {
    render(
      <StopCard
        stop={centralStation}
        isSelected={false}
        onSelect={onSelect}
        onFavoriteToggle={onFavoriteToggle}
      />,
    );

    expect(screen.getByText('Central Station')).toBeInTheDocument();
    expect(screen.getByText('Downtown')).toBeInTheDocument();
  });

  it('renders the stop code', () => {
    render(
      <StopCard
        stop={centralStation}
        isSelected={false}
        onSelect={onSelect}
        onFavoriteToggle={onFavoriteToggle}
      />,
    );

    expect(screen.getByText('Code 1001')).toBeInTheDocument();
  });

  it('renders the line numbers', () => {
    render(
      <StopCard
        stop={centralStation}
        isSelected={false}
        onSelect={onSelect}
        onFavoriteToggle={onFavoriteToggle}
      />,
    );

    expect(screen.getByText('Lines 10, 18, 42')).toBeInTheDocument();
  });

  it('renders stop card with single line', () => {
    render(
      <StopCard
        stop={marketStreet}
        isSelected={false}
        onSelect={onSelect}
        onFavoriteToggle={onFavoriteToggle}
      />,
    );

    expect(screen.getByText('Lines 10, 27')).toBeInTheDocument();
  });

  describe('view board button', () => {
    it('renders "View board" when not selected', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      const btn = screen.getByRole('button', { name: /view board/i });
      expect(btn).toBeInTheDocument();
    });

    it('renders "Viewing board" when selected', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={true}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      const btn = screen.getByRole('button', { name: /viewing board/i });
      expect(btn).toBeInTheDocument();
    });

    it('calls onSelect with stop id on click', () => {
      const handleSelect = vi.fn();

      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={handleSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /view board/i }));
      expect(handleSelect).toHaveBeenCalledWith('stop-central');
    });

    it('does not apply selected class to "View board" button when not selected', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      expect(
        screen.getByRole('button', { name: /view board/i }),
      ).not.toHaveClass('stop-select-button-selected');
    });
  });

  describe('favorite pin toggle', () => {
    it('shows "Pinned" with active class when stop is a favorite', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      const pinBtn = screen.getByRole('button', { name: /unpin central station/i });
      expect(pinBtn).toBeInTheDocument();
      expect(pinBtn).toHaveTextContent('Pinned');
      expect(pinBtn).toHaveClass('active');
      expect(pinBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows "Pin" without active class when stop is not a favorite', () => {
      render(
        <StopCard
          stop={marketStreet}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      const pinBtn = screen.getByRole('button', { name: /pin market street/i });
      expect(pinBtn).toBeInTheDocument();
      expect(pinBtn).toHaveTextContent('Pin');
      expect(pinBtn).not.toHaveClass('active');
      expect(pinBtn).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls onFavoriteToggle with stop id on click', () => {
      const handleToggle = vi.fn();

      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={handleToggle}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: /unpin central station/i }),
      );
      expect(handleToggle).toHaveBeenCalledWith('stop-central');
    });
  });

  describe('selected state', () => {
    it('applies selected class to the article when isSelected is true', () => {
      const { container } = render(
        <StopCard
          stop={centralStation}
          isSelected={true}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      const article = container.querySelector('article');
      expect(article).toHaveClass('selected');
    });

    it('does not apply selected class when isSelected is false', () => {
      const { container } = render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      const article = container.querySelector('article');
      expect(article).not.toHaveClass('selected');
    });
  });

  describe('optional labels', () => {
    it('renders metaLabel when provided', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          metaLabel="Viewed 5 min ago"
        />,
      );

      expect(screen.getByText('Viewed 5 min ago')).toBeInTheDocument();
      const metaSpan = screen.getByText('Viewed 5 min ago');
      expect(metaSpan).toHaveClass('recent-stop-meta');
    });

    it('does not render metaLabel when omitted', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      expect(screen.queryByText('Viewed 5 min ago')).not.toBeInTheDocument();
    });

    it('renders detailLabel when provided', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          detailLabel="Line 10 to Harbor Terminal"
        />,
      );

      expect(
        screen.getByText('Line 10 to Harbor Terminal'),
      ).toBeInTheDocument();
      const detailSpan = screen.getByText('Line 10 to Harbor Terminal');
      expect(detailSpan).toHaveClass('recent-stop-detail');
    });

    it('does not render detailLabel when omitted', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      expect(
        screen.queryByText('Line 10 to Harbor Terminal'),
      ).not.toBeInTheDocument();
    });

    it('renders insightLabel with calm tone by default', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          insightLabel="3 smooth arrivals"
        />,
      );

      expect(screen.getByText('3 smooth arrivals')).toBeInTheDocument();
      const insightSpan = screen.getByText('3 smooth arrivals');
      expect(insightSpan).toHaveClass('calm');
    });

    it('renders insightLabel with warning tone', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          insightLabel="2 disrupted arrivals"
          insightTone="warning"
        />,
      );

      expect(screen.getByText('2 disrupted arrivals')).toBeInTheDocument();
      const insightSpan = screen.getByText('2 disrupted arrivals');
      expect(insightSpan).toHaveClass('warning');
    });

    it('does not render insightLabel when omitted', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      expect(
        screen.queryByText('2 disrupted arrivals'),
      ).not.toBeInTheDocument();
    });
  });

  describe('dismiss button', () => {
    it('renders dismiss button when onDismiss is provided', () => {
      const onDismiss = vi.fn();

      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          onDismiss={onDismiss}
        />,
      );

      const dismissBtn = screen.getByRole('button', {
        name: /remove central station from recent history/i,
      });
      expect(dismissBtn).toBeInTheDocument();
      expect(dismissBtn).toHaveTextContent('Remove');
    });

    it('does not render dismiss button when onDismiss is omitted', () => {
      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
        />,
      );

      expect(
        screen.queryByRole('button', {
          name: /remove central station from recent history/i,
        }),
      ).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();

      render(
        <StopCard
          stop={centralStation}
          isSelected={false}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          onDismiss={onDismiss}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', {
          name: /remove central station from recent history/i,
        }),
      );
      expect(onDismiss).toHaveBeenCalledOnce();
    });
  });
});