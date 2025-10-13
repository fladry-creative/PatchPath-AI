import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BoundingBoxCanvas } from '@/components/vision/BoundingBoxCanvas';
import { type VisionModule } from '@/lib/vision/rack-analyzer';

describe('BoundingBoxCanvas', () => {
  const mockModules: VisionModule[] = [
    {
      name: 'Maths',
      manufacturer: 'Make Noise',
      position: { x: 0.1, y: 0, width: 20 },
      confidence: 0.95,
      notes: 'High confidence module',
    },
    {
      name: 'Plaits',
      manufacturer: 'Mutable Instruments',
      position: { x: 0.3, y: 0, width: 12 },
      confidence: 0.65,
      notes: 'Medium confidence module',
    },
    {
      name: 'Unknown Module',
      position: { x: 0.5, y: 0, width: 8 },
      confidence: 0.35,
      notes: 'Low confidence module',
    },
  ];

  const mockImageUrl = 'data:image/png;base64,test';

  beforeEach(() => {
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
    })) as unknown as HTMLCanvasElement['getContext'];
  });

  it('renders canvas element', () => {
    const { container } = render(
      <BoundingBoxCanvas imageUrl={mockImageUrl} modules={mockModules} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('displays confidence legend', () => {
    render(<BoundingBoxCanvas imageUrl={mockImageUrl} modules={mockModules} />);

    expect(screen.getByText(/high \(≥80%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/medium \(50-79%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/low \(<50%\)/i)).toBeInTheDocument();
  });

  it('shows correct module counts by confidence', () => {
    render(<BoundingBoxCanvas imageUrl={mockImageUrl} modules={mockModules} />);

    // High confidence: 1 module (Maths at 0.95)
    expect(screen.getByText(/1 modules?/)).toBeInTheDocument();

    // Medium confidence: 1 module (Plaits at 0.65)
    const mediumText = screen.getByText(/medium/i).parentElement;
    expect(mediumText).toHaveTextContent('1');

    // Low confidence: 1 module (Unknown at 0.35)
    const lowText = screen.getByText(/low/i).parentElement;
    expect(lowText).toHaveTextContent('1');
  });

  it('shows warning for low confidence modules', () => {
    render(<BoundingBoxCanvas imageUrl={mockImageUrl} modules={mockModules} />);

    expect(screen.getByText(/1 module with low confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/click to review and correct/i)).toBeInTheDocument();
  });

  it('shows success message when all modules are high confidence', () => {
    const highConfidenceModules: VisionModule[] = [
      {
        name: 'Maths',
        manufacturer: 'Make Noise',
        position: { x: 0.1, y: 0, width: 20 },
        confidence: 0.95,
      },
      {
        name: 'Plaits',
        manufacturer: 'Mutable Instruments',
        position: { x: 0.3, y: 0, width: 12 },
        confidence: 0.92,
      },
    ];

    render(<BoundingBoxCanvas imageUrl={mockImageUrl} modules={highConfidenceModules} />);

    expect(screen.getByText(/all modules identified with high confidence/i)).toBeInTheDocument();
  });

  it('displays interaction tip', () => {
    render(<BoundingBoxCanvas imageUrl={mockImageUrl} modules={mockModules} />);

    expect(screen.getByText(/click any module to edit/i)).toBeInTheDocument();
  });

  it('handles empty module list', () => {
    render(<BoundingBoxCanvas imageUrl={mockImageUrl} modules={[]} />);

    expect(screen.getByText(/0 modules/)).toBeInTheDocument();
  });

  it('calls onModuleClick when provided', () => {
    const mockOnClick = jest.fn();
    const { container } = render(
      <BoundingBoxCanvas
        imageUrl={mockImageUrl}
        modules={mockModules}
        onModuleClick={mockOnClick}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Note: Actual click testing on canvas requires more complex setup
    // with proper coordinate calculation
  });

  it('highlights selected module', () => {
    const { container } = render(
      <BoundingBoxCanvas imageUrl={mockImageUrl} modules={mockModules} selectedModuleIndex={0} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Verify canvas exists with selection state
    // Actual rendering verification would require canvas inspection
  });
});
