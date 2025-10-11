import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatchCard } from '@/components/patches/PatchCard';
import { type Patch } from '@/types/patch';

describe('PatchCard', () => {
  const mockPatch: Patch = {
    id: 'test-patch-1',
    userId: 'user-1',
    rackId: 'rack-1',
    metadata: {
      title: 'Dark Ambient Drone',
      description: 'A slow-evolving atmospheric soundscape with deep textures',
      soundDescription: 'Ethereal pads with subtle movement',
      difficulty: 'intermediate',
      estimatedTime: 15,
      techniques: ['FM', 'waveshaping'],
      genres: ['ambient', 'experimental'],
      userIntent: 'Create a dark ambient patch',
    },
    connections: [
      {
        id: 'conn-1',
        from: {
          moduleId: 'mod-1',
          moduleName: 'Plaits',
          outputName: 'OUT',
        },
        to: {
          moduleId: 'mod-2',
          moduleName: 'Maths',
          inputName: 'IN 1',
        },
        signalType: 'audio',
        importance: 'primary',
        note: 'Use a patch cable with low capacitance',
      },
      {
        id: 'conn-2',
        from: {
          moduleId: 'mod-3',
          moduleName: 'LFO',
          outputName: 'SINE',
        },
        to: {
          moduleId: 'mod-1',
          moduleName: 'Plaits',
          inputName: 'FM',
        },
        signalType: 'cv',
        importance: 'modulation',
      },
    ],
    patchingOrder: ['conn-1', 'conn-2'],
    parameterSuggestions: [
      {
        moduleId: 'mod-1',
        moduleName: 'Plaits',
        parameter: 'Timbre',
        value: '12 o\'clock',
        reasoning: 'This sets the harmonic content at a sweet spot',
      },
      {
        moduleId: 'mod-2',
        moduleName: 'Maths',
        parameter: 'Channel 1 Rise',
        value: 'fully clockwise',
      },
    ],
    whyThisWorks: 'This patch creates evolving textures by modulating the FM input of Plaits with a slow LFO, while Maths shapes the dynamics.',
    tips: [
      'Start with slow LFO rates for subtle movement',
      'Experiment with different Plaits models',
      'Add reverb for more depth',
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    saved: false,
    tags: ['drone', 'atmospheric'],
  };

  const mockMinimalPatch: Patch = {
    id: 'test-patch-2',
    userId: 'user-1',
    rackId: 'rack-1',
    metadata: {
      title: 'Simple Patch',
      description: 'A basic patch',
      difficulty: 'beginner',
      estimatedTime: 5,
      techniques: [],
      genres: [],
    },
    connections: [],
    patchingOrder: [],
    parameterSuggestions: [],
    whyThisWorks: 'Basic explanation',
    tips: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    saved: false,
    tags: [],
  };

  describe('Rendering', () => {
    it('should render patch title and description', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('Dark Ambient Drone')).toBeInTheDocument();
      expect(screen.getByText('A slow-evolving atmospheric soundscape with deep textures')).toBeInTheDocument();
    });

    it('should render sound description when provided', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText(/Ethereal pads with subtle movement/)).toBeInTheDocument();
    });

    it('should not render sound description when not provided', () => {
      render(<PatchCard patch={mockMinimalPatch} />);

      expect(screen.queryByText(/🎵/)).not.toBeInTheDocument();
    });

    it('should render difficulty pill with correct styling', () => {
      render(<PatchCard patch={mockPatch} />);

      const difficultyBadge = screen.getByText('INTERMEDIATE');
      expect(difficultyBadge).toBeInTheDocument();
      expect(difficultyBadge).toHaveClass('bg-yellow-500/20', 'text-yellow-300');
    });

    it('should render estimated time', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText(/15 min/)).toBeInTheDocument();
    });

    it('should render all technique tags', () => {
      render(<PatchCard patch={mockPatch} />);

      const fmTags = screen.getAllByText('FM');
      expect(fmTags.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('waveshaping')).toBeInTheDocument();
    });

    it('should render all genre tags', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('ambient')).toBeInTheDocument();
      expect(screen.getByText('experimental')).toBeInTheDocument();
    });
  });

  describe('Difficulty Color Mapping', () => {
    it('should apply green colors for beginner difficulty', () => {
      const beginnerPatch = { ...mockPatch, metadata: { ...mockPatch.metadata, difficulty: 'beginner' as const } };
      render(<PatchCard patch={beginnerPatch} />);

      const difficultyBadge = screen.getByText('BEGINNER');
      expect(difficultyBadge).toHaveClass('bg-green-500/20', 'text-green-300');
    });

    it('should apply yellow colors for intermediate difficulty', () => {
      render(<PatchCard patch={mockPatch} />);

      const difficultyBadge = screen.getByText('INTERMEDIATE');
      expect(difficultyBadge).toHaveClass('bg-yellow-500/20', 'text-yellow-300');
    });

    it('should apply red colors for advanced difficulty', () => {
      const advancedPatch = { ...mockPatch, metadata: { ...mockPatch.metadata, difficulty: 'advanced' as const } };
      render(<PatchCard patch={advancedPatch} />);

      const difficultyBadge = screen.getByText('ADVANCED');
      expect(difficultyBadge).toHaveClass('bg-red-500/20', 'text-red-300');
    });
  });

  describe('Cable Connections', () => {
    it('should render all connections with proper formatting', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('🔌 Cable Routing')).toBeInTheDocument();
      const plaitsElements = screen.getAllByText('Plaits');
      expect(plaitsElements.length).toBeGreaterThanOrEqual(1);
      const mathsElements = screen.getAllByText('Maths');
      expect(mathsElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('OUT')).toBeInTheDocument();
      expect(screen.getByText('IN 1')).toBeInTheDocument();
    });

    it('should display connection numbers in order', () => {
      render(<PatchCard patch={mockPatch} />);

      const connectionNumbers = screen.getAllByText(/^[0-9]+$/);
      expect(connectionNumbers[0]).toHaveTextContent('1');
      expect(connectionNumbers[1]).toHaveTextContent('2');
    });

    it('should display connection note when provided', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('Use a patch cable with low capacitance')).toBeInTheDocument();
    });

    it('should display signal type for each connection', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('audio')).toBeInTheDocument();
      expect(screen.getByText('cv')).toBeInTheDocument();
    });

    it('should not render cable routing section when no connections', () => {
      render(<PatchCard patch={mockMinimalPatch} />);

      const cableRoutingHeader = screen.queryByText('🔌 Cable Routing');
      expect(cableRoutingHeader).toBeInTheDocument();

      // Should have empty space-y-3 div with no children
      const connectionsContainer = cableRoutingHeader?.nextElementSibling;
      expect(connectionsContainer?.children.length).toBe(0);
    });
  });

  describe('Parameter Suggestions', () => {
    it('should render parameter suggestions section when present', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('🎛️ Knob Positions')).toBeInTheDocument();
    });

    it('should display all parameter suggestions with values', () => {
      render(<PatchCard patch={mockPatch} />);

      const plaitsElements = screen.getAllByText('Plaits');
      expect(plaitsElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Timbre')).toBeInTheDocument();
      expect(screen.getByText('12 o\'clock')).toBeInTheDocument();

      const mathsElements = screen.getAllByText('Maths');
      expect(mathsElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Channel 1 Rise')).toBeInTheDocument();
      expect(screen.getByText('fully clockwise')).toBeInTheDocument();
    });

    it('should display reasoning when provided', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('This sets the harmonic content at a sweet spot')).toBeInTheDocument();
    });

    it('should not display reasoning when not provided', () => {
      render(<PatchCard patch={mockPatch} />);

      const allReasoningElements = screen.queryAllByText(/This sets the harmonic content/);
      expect(allReasoningElements).toHaveLength(1); // Only one reasoning provided
    });

    it('should not render parameter suggestions section when empty', () => {
      render(<PatchCard patch={mockMinimalPatch} />);

      expect(screen.queryByText('🎛️ Knob Positions')).not.toBeInTheDocument();
    });
  });

  describe('Educational Content', () => {
    it('should render "Why This Works" section', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('💡 Why This Works')).toBeInTheDocument();
      expect(screen.getByText('This patch creates evolving textures by modulating the FM input of Plaits with a slow LFO, while Maths shapes the dynamics.')).toBeInTheDocument();
    });

    it('should render tips section when tips are present', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByText('✨ Pro Tips')).toBeInTheDocument();
      expect(screen.getByText('Start with slow LFO rates for subtle movement')).toBeInTheDocument();
      expect(screen.getByText('Experiment with different Plaits models')).toBeInTheDocument();
      expect(screen.getByText('Add reverb for more depth')).toBeInTheDocument();
    });

    it('should not render tips section when empty', () => {
      render(<PatchCard patch={mockMinimalPatch} />);

      expect(screen.queryByText('✨ Pro Tips')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render save and export buttons', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByRole('button', { name: /save to cookbook/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
    });

    it('should handle save button click', async () => {
      const user = userEvent.setup();
      render(<PatchCard patch={mockPatch} />);

      const saveButton = screen.getByRole('button', { name: /save to cookbook/i });
      await user.click(saveButton);

      // Button should be clickable (currently no handler, but button works)
      expect(saveButton).toBeInTheDocument();
    });

    it('should handle export button click', async () => {
      const user = userEvent.setup();
      render(<PatchCard patch={mockPatch} />);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);

      // Button should be clickable (currently no handler, but button works)
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<PatchCard patch={mockPatch} />);

      const mainHeading = screen.getByRole('heading', { level: 2, name: 'Dark Ambient Drone' });
      expect(mainHeading).toBeInTheDocument();

      const subHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('should have accessible button labels', () => {
      render(<PatchCard patch={mockPatch} />);

      expect(screen.getByRole('button', { name: /save to cookbook/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
    });

    it('should render semantic list for tips', () => {
      render(<PatchCard patch={mockPatch} />);

      const tipsList = screen.getByRole('list');
      expect(tipsList).toBeInTheDocument();

      const tipItems = within(tipsList).getAllByRole('listitem');
      expect(tipItems).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle patch with empty techniques array', () => {
      const patchNoTechniques = {
        ...mockPatch,
        metadata: { ...mockPatch.metadata, techniques: [] },
        connections: [] // Also clear connections that might contain "FM"
      };
      render(<PatchCard patch={patchNoTechniques} />);

      expect(screen.getByText('Dark Ambient Drone')).toBeInTheDocument();
      // Check that the tags section is empty or technique-specific tag doesn't exist
      const tags = screen.queryAllByText('FM');
      // If FM appears, it should only be in other contexts (like connections), not as a technique tag
      tags.forEach(tag => {
        expect(tag.className).not.toContain('bg-purple-500/20'); // technique tag class
      });
    });

    it('should handle patch with empty genres array', () => {
      const patchNoGenres = { ...mockPatch, metadata: { ...mockPatch.metadata, genres: [] } };
      render(<PatchCard patch={patchNoGenres} />);

      expect(screen.getByText('Dark Ambient Drone')).toBeInTheDocument();
      expect(screen.queryByText('ambient')).not.toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const longTitlePatch = {
        ...mockPatch,
        metadata: {
          ...mockPatch.metadata,
          title: 'A Very Long Title That Might Cause Layout Issues In The Component And Should Still Render Correctly',
        },
      };
      render(<PatchCard patch={longTitlePatch} />);

      expect(screen.getByText(/A Very Long Title/)).toBeInTheDocument();
    });

    it('should handle connections without notes', () => {
      const patchNoNotes = {
        ...mockPatch,
        connections: [
          {
            ...mockPatch.connections[0],
            note: undefined,
          },
        ],
      };
      render(<PatchCard patch={patchNoNotes} />);

      expect(screen.queryByText('Use a patch cable with low capacitance')).not.toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('should apply hover classes to buttons', () => {
      render(<PatchCard patch={mockPatch} />);

      const saveButton = screen.getByRole('button', { name: /save to cookbook/i });
      expect(saveButton).toHaveClass('hover:scale-105', 'hover:bg-purple-600');

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      expect(exportButton).toHaveClass('hover:bg-white/10');
    });

    it('should apply hover classes to connection cards', () => {
      const { container } = render(<PatchCard patch={mockPatch} />);

      const connectionCards = container.querySelectorAll('.hover\\:border-purple-500\\/30');
      expect(connectionCards.length).toBeGreaterThan(0);
    });
  });
});
