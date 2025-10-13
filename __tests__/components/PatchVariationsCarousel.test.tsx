/**
 * Tests for PatchVariationsCarousel component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatchVariationsCarousel } from '@/components/patches/PatchVariationsCarousel';
import { type Patch } from '@/types/patch';

// Mock Embla Carousel
jest.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: jest.fn(() => [
    jest.fn(), // emblaRef
    {
      // emblaApi
      scrollPrev: jest.fn(),
      scrollNext: jest.fn(),
      scrollTo: jest.fn(),
      selectedScrollSnap: jest.fn(() => 0),
      canScrollPrev: jest.fn(() => false),
      canScrollNext: jest.fn(() => true),
      on: jest.fn(),
      off: jest.fn(),
    },
  ]),
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLProps<HTMLButtonElement>>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock PatchCard component
jest.mock('@/components/patches/PatchCard', () => ({
  PatchCard: ({ patch }: { patch: Patch }) => (
    <div data-testid="patch-card">{patch.metadata.title}</div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span>←</span>,
  ChevronRight: () => <span>→</span>,
  Check: () => <span>✓</span>,
}));

const mockVariations: Patch[] = [
  {
    id: 'variation-1',
    userId: 'user-1',
    rackId: 'rack-1',
    metadata: {
      title: 'Variation 1',
      description: 'First variation',
      difficulty: 'intermediate',
      estimatedTime: 10,
      techniques: ['FM'],
      genres: ['ambient'],
      rackType: 'audio',
    },
    connections: [],
    patchingOrder: [],
    parameterSuggestions: [],
    whyThisWorks: 'Test explanation',
    tips: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    saved: false,
    tags: [],
  },
  {
    id: 'variation-2',
    userId: 'user-1',
    rackId: 'rack-1',
    metadata: {
      title: 'Variation 2',
      description: 'Second variation',
      difficulty: 'beginner',
      estimatedTime: 5,
      techniques: ['Subtractive'],
      genres: ['techno'],
      rackType: 'audio',
    },
    connections: [],
    patchingOrder: [],
    parameterSuggestions: [],
    whyThisWorks: 'Test explanation 2',
    tips: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    saved: false,
    tags: [],
  },
];

describe('PatchVariationsCarousel', () => {
  const mockOnAdopt = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders variations count', () => {
    render(<PatchVariationsCarousel variations={mockVariations} onAdoptVariation={mockOnAdopt} />);

    expect(screen.getByText(/Variations \(2\)/i)).toBeInTheDocument();
  });

  it('renders variation labels', () => {
    render(<PatchVariationsCarousel variations={mockVariations} onAdoptVariation={mockOnAdopt} />);

    expect(screen.getByText('Variation 1')).toBeInTheDocument();
    expect(screen.getByText('Variation 2')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<PatchVariationsCarousel variations={mockVariations} onAdoptVariation={mockOnAdopt} />);

    expect(screen.getByLabelText('Previous variation')).toBeInTheDocument();
    expect(screen.getByLabelText('Next variation')).toBeInTheDocument();
  });

  it('renders dot navigation', () => {
    render(<PatchVariationsCarousel variations={mockVariations} onAdoptVariation={mockOnAdopt} />);

    expect(screen.getByLabelText('Go to variation 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to variation 2')).toBeInTheDocument();
  });

  it('shows active badge for adopted variation', () => {
    render(
      <PatchVariationsCarousel
        variations={mockVariations}
        onAdoptVariation={mockOnAdopt}
        adoptedIndex={0}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('hides adopt button for adopted variation', () => {
    render(
      <PatchVariationsCarousel
        variations={mockVariations}
        onAdoptVariation={mockOnAdopt}
        adoptedIndex={0}
      />
    );

    // First variation should not have "Use This Patch" button
    const adoptButtons = screen.queryAllByText('Use This Patch');
    expect(adoptButtons.length).toBeLessThan(mockVariations.length);
  });

  it('shows keyboard navigation hint', () => {
    render(<PatchVariationsCarousel variations={mockVariations} onAdoptVariation={mockOnAdopt} />);

    expect(screen.getByText(/Use ← → arrow keys to navigate/i)).toBeInTheDocument();
  });

  it('returns null when no variations', () => {
    const { container: _container } = render(
      <PatchVariationsCarousel variations={[]} onAdoptVariation={mockOnAdopt} />
    );

    expect(_container.firstChild).toBeNull();
  });
});
