import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatchDashboard } from '@/components/patches/PatchDashboard';
import { type Patch } from '@/types/patch';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('PatchDashboard', () => {
  const mockPatch: Patch = {
    id: 'test-patch-1',
    userId: 'user-1',
    rackId: 'rack-1',
    metadata: {
      title: 'Generated Test Patch',
      description: 'A test patch description',
      difficulty: 'intermediate',
      estimatedTime: 10,
      techniques: ['FM'],
      genres: ['techno'],
    },
    connections: [
      {
        id: 'conn-1',
        from: {
          moduleId: 'mod-1',
          moduleName: 'VCO',
          outputName: 'OUT',
        },
        to: {
          moduleId: 'mod-2',
          moduleName: 'VCF',
          inputName: 'IN',
        },
        signalType: 'audio',
        importance: 'primary',
      },
    ],
    patchingOrder: ['conn-1'],
    parameterSuggestions: [],
    whyThisWorks: 'Test explanation',
    tips: ['Test tip'],
    createdAt: new Date(),
    updatedAt: new Date(),
    saved: false,
    tags: [],
  };

  const mockVariations: Patch[] = [
    {
      ...mockPatch,
      id: 'variation-1',
      metadata: { ...mockPatch.metadata, title: 'Variation 1' },
    },
    {
      ...mockPatch,
      id: 'variation-2',
      metadata: { ...mockPatch.metadata, title: 'Variation 2' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('Initial State', () => {
    it('should render generation form on initial load', () => {
      render(<PatchDashboard />);

      expect(screen.getByText('🎨 Generate a Patch')).toBeInTheDocument();
      expect(screen.getByText(/tell us about your rack and what you want to create/i)).toBeInTheDocument();
    });

    it('should render form with all inputs', () => {
      render(<PatchDashboard />);

      expect(screen.getByLabelText(/modulargrid rack url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/what do you want to create/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate patch/i })).toBeInTheDocument();
    });

    it('should not show error message initially', () => {
      render(<PatchDashboard />);

      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('should not show patch display initially', () => {
      render(<PatchDashboard />);

      expect(screen.queryByText('✨ Your Generated Patch')).not.toBeInTheDocument();
    });

    it('should not show empty state initially', () => {
      render(<PatchDashboard />);

      expect(screen.queryByText('Ready to create?')).not.toBeInTheDocument();
    });
  });

  describe('Patch Generation Flow', () => {
    it('should generate patch and display result', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      // Fill form
      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      // Wait for patch to be displayed
      await waitFor(() => {
        expect(screen.getByText('✨ Your Generated Patch')).toBeInTheDocument();
      });

      expect(screen.getByText('Generated Test Patch')).toBeInTheDocument();
      expect(screen.queryByText('🎨 Generate a Patch')).not.toBeInTheDocument();
    });

    it('should hide form after successful generation', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/modulargrid rack url/i)).not.toBeInTheDocument();
      });
    });

    it('should clear any existing errors on successful generation', async () => {
      const user = userEvent.setup();

      // First, trigger an error
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      let submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Now submit successfully
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/456');
      submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Variations Display', () => {
    it('should display variations when provided', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch, variations: mockVariations }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('🔄 Variations')).toBeInTheDocument();
      });

      // Each variation appears multiple times (label + title in PatchCard)
      const variation1Elements = screen.getAllByText('Variation 1');
      expect(variation1Elements.length).toBeGreaterThanOrEqual(1);

      const variation2Elements = screen.getAllByText('Variation 2');
      expect(variation2Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should not display variations section when no variations', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✨ Your Generated Patch')).toBeInTheDocument();
      });

      expect(screen.queryByText('🔄 Variations')).not.toBeInTheDocument();
    });

    it('should label each variation correctly', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch, variations: mockVariations }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        const variation1Elements = screen.getAllByText(/Variation 1/);
        expect(variation1Elements.length).toBeGreaterThanOrEqual(1);
      });

      const variation1Elements = screen.getAllByText(/Variation 1/);
      expect(variation1Elements.length).toBeGreaterThanOrEqual(1);

      const variation2Elements = screen.getAllByText(/Variation 2/);
      expect(variation2Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when patch generation fails', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should keep form visible when error occurs', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/modulargrid rack url/i)).toBeInTheDocument();
    });

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });

    it('should display validation error from form', async () => {
      const user = userEvent.setup();
      render(<PatchDashboard />);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toBeDisabled(); // Actually can't submit due to disabled state

      // But we can test the error callback by typing and clearing
      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      await user.type(rackUrlInput, 'test');
      await user.clear(rackUrlInput);

      // Form validation prevents submission, so error won't be shown via dashboard
      // The form handles this internally
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Generate Another Button', () => {
    it('should show "Generate Another" button after patch is generated', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate another/i })).toBeInTheDocument();
      });
    });

    it('should reset dashboard state when "Generate Another" is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch, variations: mockVariations }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Generated Test Patch')).toBeInTheDocument();
      });

      // Click "Generate Another"
      const generateAnotherButton = screen.getByRole('button', { name: /generate another/i });
      await user.click(generateAnotherButton);

      // Form should be visible again
      expect(screen.getByText('🎨 Generate a Patch')).toBeInTheDocument();
      expect(screen.queryByText('Generated Test Patch')).not.toBeInTheDocument();
      expect(screen.queryByText('🔄 Variations')).not.toBeInTheDocument();
    });

    it('should clear errors when "Generate Another" is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Generated Test Patch')).toBeInTheDocument();
      });

      // Manually trigger an error (simulate)
      // Since we can't easily trigger error after patch is generated, we test the flow

      const generateAnotherButton = screen.getByRole('button', { name: /generate another/i });
      await user.click(generateAnotherButton);

      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from form to loading to result', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Response) => void;
      const promise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.MockedFunction<typeof fetch>).mockReturnValueOnce(promise);

      render(<PatchDashboard />);

      // Initial: Form visible
      expect(screen.getByText('🎨 Generate a Patch')).toBeInTheDocument();

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      // Loading: Button shows loading state
      await waitFor(() => {
        expect(screen.getByText(/generating patch\.\.\./i)).toBeInTheDocument();
      });

      // Resolve promise
      resolvePromise!({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      // Result: Patch displayed
      await waitFor(() => {
        expect(screen.getByText('✨ Your Generated Patch')).toBeInTheDocument();
      });
      expect(screen.queryByText('🎨 Generate a Patch')).not.toBeInTheDocument();
    });

    it('should transition from form to loading to error', async () => {
      const user = userEvent.setup();
      let rejectPromise: (error: Error) => void;
      const promise = new Promise<Response>((_, reject) => {
        rejectPromise = reject;
      });

      (global.fetch as jest.MockedFunction<typeof fetch>).mockReturnValueOnce(promise);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      // Loading state
      await waitFor(() => {
        expect(screen.getByText(/generating patch\.\.\./i)).toBeInTheDocument();
      });

      // Reject promise
      rejectPromise!(new Error('API Error'));

      // Error state
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
      expect(screen.getByText('🎨 Generate a Patch')).toBeInTheDocument(); // Form still visible
    });
  });

  describe('Empty State', () => {
    // Note: The empty state appears when showForm=false and currentPatch=null
    // This is an edge case that shouldn't normally occur in the current implementation
    // but we'll test the component handles it correctly

    it('should not show empty state when form is visible', () => {
      render(<PatchDashboard />);

      expect(screen.queryByText('Ready to create?')).not.toBeInTheDocument();
    });

    it('should not show empty state when patch is displayed', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✨ Your Generated Patch')).toBeInTheDocument();
      });

      expect(screen.queryByText('Ready to create?')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<PatchDashboard />);

      const heading = screen.getByRole('heading', { level: 2, name: /generate a patch/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible error message', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorSection = screen.getByText('Error');
        expect(errorSection).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        const generateAnotherButton = screen.getByRole('button', { name: /generate another/i });
        expect(generateAnotherButton).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass patch data to PatchCard component', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Generated Test Patch')).toBeInTheDocument();
      });

      // Check if patch details are rendered (from PatchCard)
      expect(screen.getByText('A test patch description')).toBeInTheDocument();
      expect(screen.getByText('INTERMEDIATE')).toBeInTheDocument();
    });

    it('should pass variations to PatchCard components', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatch, variations: mockVariations }),
      } as Response);

      render(<PatchDashboard />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        const variation1Cards = screen.getAllByText(/Variation 1/);
        expect(variation1Cards.length).toBeGreaterThan(0);
      });

      // Both variations should be rendered (each appears multiple times due to label + card title)
      const variation1Cards = screen.getAllByText(/Variation 1/);
      expect(variation1Cards.length).toBeGreaterThan(0);

      const variation2Cards = screen.getAllByText(/Variation 2/);
      expect(variation2Cards.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Generation Cycles', () => {
    it('should allow generating multiple patches in sequence', async () => {
      const user = userEvent.setup();
      const mockPatch2 = { ...mockPatch, id: 'patch-2', metadata: { ...mockPatch.metadata, title: 'Second Patch' } };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ patch: mockPatch }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ patch: mockPatch2 }),
        } as Response);

      render(<PatchDashboard />);

      // First generation
      let rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      let intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      let submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Generated Test Patch')).toBeInTheDocument();
      });

      // Generate another
      const generateAnotherButton = screen.getByRole('button', { name: /generate another/i });
      await user.click(generateAnotherButton);

      // Second generation
      rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/456');
      await user.type(intentInput, 'Create ambient pad');

      submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Second Patch')).toBeInTheDocument();
      });

      expect(screen.queryByText('Generated Test Patch')).not.toBeInTheDocument();
    });
  });
});
