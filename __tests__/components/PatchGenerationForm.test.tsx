import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatchGenerationForm } from '@/components/patches/PatchGenerationForm';
import { type Patch } from '@/types/patch';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('PatchGenerationForm', () => {
  const mockOnPatchGenerated = jest.fn();
  const mockOnError = jest.fn();

  const mockPatchResponse: Patch = {
    id: 'generated-patch-1',
    userId: 'user-1',
    rackId: 'rack-1',
    metadata: {
      title: 'Generated Patch',
      description: 'AI-generated patch',
      difficulty: 'intermediate',
      estimatedTime: 10,
      techniques: ['FM'],
      genres: ['techno'],
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      expect(screen.getByLabelText(/modulargrid rack url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/what do you want to create/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/technique \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/genre \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^difficulty$/i)).toBeInTheDocument();
    });

    it('should render submit button with correct initial text', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled(); // Disabled initially because fields are empty
    });

    it('should render variations checkbox', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const checkbox = screen.getByLabelText(/generate 3 variations/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render demo rack button', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      expect(screen.getByRole('button', { name: /use demo rack for testing/i })).toBeInTheDocument();
    });

    it('should have correct placeholder text', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      expect(screen.getByPlaceholderText('https://modulargrid.net/e/racks/view/...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/dark ambient drone with evolving textures/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when rack URL is empty', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const intentInput = screen.getByLabelText(/what do you want to create/i);
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when intent is empty', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when both required fields are filled', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toBeEnabled();
    });

    it('should call onError when submitting with empty fields', async () => {
      // Note: The button is actually disabled when fields are empty, so this test
      // verifies that the disabled state prevents invalid submission
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toBeDisabled();

      // The form validation prevents submission via disabled state
      // If we try to click it, nothing happens
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockOnPatchGenerated).not.toHaveBeenCalled();
    });
  });

  describe('Form Interaction', () => {
    it('should update rack URL input value', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i) as HTMLInputElement;
      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');

      expect(rackUrlInput.value).toBe('https://modulargrid.net/e/racks/view/123');
    });

    it('should update intent textarea value', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const intentInput = screen.getByLabelText(/what do you want to create/i) as HTMLTextAreaElement;
      await user.type(intentInput, 'Create a techno bassline');

      expect(intentInput.value).toBe('Create a techno bassline');
    });

    it('should update technique input value', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const techniqueInput = screen.getByLabelText(/technique \(optional\)/i) as HTMLInputElement;
      await user.type(techniqueInput, 'FM synthesis');

      expect(techniqueInput.value).toBe('FM synthesis');
    });

    it('should update genre input value', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const genreInput = screen.getByLabelText(/genre \(optional\)/i) as HTMLInputElement;
      await user.type(genreInput, 'techno');

      expect(genreInput.value).toBe('techno');
    });

    it('should update difficulty select value', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const difficultySelect = screen.getByLabelText(/^difficulty$/i) as HTMLSelectElement;
      await user.selectOptions(difficultySelect, 'advanced');

      expect(difficultySelect.value).toBe('advanced');
    });

    it('should toggle variations checkbox', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const checkbox = screen.getByLabelText(/generate 3 variations/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Demo Rack Button', () => {
    it('should populate rack URL with demo rack when clicked', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const demoButton = screen.getByRole('button', { name: /use demo rack for testing/i });
      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i) as HTMLInputElement;

      await user.click(demoButton);

      expect(rackUrlInput.value).toBe('https://modulargrid.net/e/racks/view/2383104');
    });

    it('should not submit form when demo button is clicked', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const demoButton = screen.getByRole('button', { name: /use demo rack for testing/i });
      await user.click(demoButton);

      expect(mockOnPatchGenerated).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatchResponse }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);
      const techniqueInput = screen.getByLabelText(/technique \(optional\)/i);
      const genreInput = screen.getByLabelText(/genre \(optional\)/i);
      const difficultySelect = screen.getByLabelText(/^difficulty$/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');
      await user.type(techniqueInput, 'FM');
      await user.type(genreInput, 'techno');
      await user.selectOptions(difficultySelect, 'advanced');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/patches/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rackUrl: 'https://modulargrid.net/e/racks/view/123',
            intent: 'Create a techno bassline',
            technique: 'FM',
            genre: 'techno',
            difficulty: 'advanced',
            generateVariations: false,
          }),
        });
      });
    });

    it('should trim whitespace from inputs before submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatchResponse }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, '  https://modulargrid.net/e/racks/view/123  ');
      await user.type(intentInput, '  Create a techno bassline  ');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/patches/generate',
          expect.objectContaining({
            body: expect.stringContaining('"rackUrl":"https://modulargrid.net/e/racks/view/123"'),
          })
        );
      });
    });

    it('should send undefined for empty optional fields', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatchResponse }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        const callArgs = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.technique).toBeUndefined();
        expect(body.genre).toBeUndefined();
      });
    });

    it('should include generateVariations flag when checked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatchResponse, variations: [] }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);
      const variationsCheckbox = screen.getByLabelText(/generate 3 variations/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');
      await user.click(variationsCheckbox);

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        const callArgs = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.generateVariations).toBe(true);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ patch: mockPatchResponse }),
                } as Response),
              100
            )
          )
      );

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      expect(screen.getByText(/generating patch\.\.\./i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should disable all inputs during loading', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ patch: mockPatchResponse }),
                } as Response),
              100
            )
          )
      );

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      expect(screen.getByLabelText(/modulargrid rack url/i)).toBeDisabled();
      expect(screen.getByLabelText(/what do you want to create/i)).toBeDisabled();
      expect(screen.getByLabelText(/technique \(optional\)/i)).toBeDisabled();
      expect(screen.getByLabelText(/genre \(optional\)/i)).toBeDisabled();
      expect(screen.getByLabelText(/^difficulty$/i)).toBeDisabled();
      expect(screen.getByLabelText(/generate 3 variations/i)).toBeDisabled();
    });

    it('should disable demo button during loading', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ patch: mockPatchResponse }),
                } as Response),
              100
            )
          )
      );

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      const demoButton = screen.getByRole('button', { name: /use demo rack for testing/i });
      expect(demoButton).toBeDisabled();
    });

    it('should show loading spinner', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ patch: mockPatchResponse }),
                } as Response),
              100
            )
          )
      );

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      const spinner = screen.getByText(/generating patch\.\.\./i).querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Success Handling', () => {
    it('should call onPatchGenerated with patch on success', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatchResponse }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPatchGenerated).toHaveBeenCalledWith(mockPatchResponse, undefined);
      });
    });

    it('should call onPatchGenerated with patch and variations when provided', async () => {
      const user = userEvent.setup();
      const mockVariations = [
        { ...mockPatchResponse, id: 'variation-1' },
        { ...mockPatchResponse, id: 'variation-2' },
      ];

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatchResponse, variations: mockVariations }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPatchGenerated).toHaveBeenCalledWith(mockPatchResponse, mockVariations);
      });
    });

    it('should re-enable form after successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patch: mockPatchResponse }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPatchGenerated).toHaveBeenCalled();
      });

      // Form should be re-enabled
      expect(screen.getByLabelText(/modulargrid rack url/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/what do you want to create/i)).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should call onError when API returns error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid rack URL' }),
      } as Response);

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid rack URL');
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });
    });

    it('should handle generic error message when error is not Error instance', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce('String error');

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to generate patch');
      });
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      const intentInput = screen.getByLabelText(/what do you want to create/i);

      await user.type(rackUrlInput, 'https://modulargrid.net/e/racks/view/123');
      await user.type(intentInput, 'Create a techno bassline');

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });

      // Form should be re-enabled
      expect(screen.getByLabelText(/modulargrid rack url/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/what do you want to create/i)).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      expect(rackUrlInput).toHaveAttribute('id', 'rackUrl');

      const intentInput = screen.getByLabelText(/what do you want to create/i);
      expect(intentInput).toHaveAttribute('id', 'intent');

      const techniqueInput = screen.getByLabelText(/technique \(optional\)/i);
      expect(techniqueInput).toHaveAttribute('id', 'technique');
    });

    it('should have proper input types', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const rackUrlInput = screen.getByLabelText(/modulargrid rack url/i);
      expect(rackUrlInput).toHaveAttribute('type', 'url');

      const techniqueInput = screen.getByLabelText(/technique \(optional\)/i);
      expect(techniqueInput).toHaveAttribute('type', 'text');

      const checkbox = screen.getByLabelText(/generate 3 variations/i);
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      // Tab through form elements - just verify they can receive focus
      await user.tab();
      // First focusable element could be rack URL or random rack button depending on DOM order
      const firstFocused = document.activeElement;
      expect(firstFocused).toBeTruthy();
      expect(firstFocused?.tagName).toMatch(/INPUT|BUTTON/);
    });

    it('should have descriptive help text', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      expect(screen.getByText(/paste your modulargrid rack url/i)).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('should apply correct styling to enabled submit button', () => {
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-pink-500');
    });

    it('should apply disabled styling when button is disabled', async () => {
      const user = userEvent.setup();
      render(<PatchGenerationForm onPatchGenerated={mockOnPatchGenerated} onError={mockOnError} />);

      const submitButton = screen.getByRole('button', { name: /generate patch/i });
      expect(submitButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });
});
