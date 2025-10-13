import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ModuleCorrectionPanel } from '@/components/vision/ModuleCorrectionPanel';
import { type VisionModule } from '@/lib/vision/rack-analyzer';

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

describe('ModuleCorrectionPanel', () => {
  const mockModule: VisionModule = {
    name: 'Maths',
    manufacturer: 'Make Noise',
    position: { x: 0.1, y: 0, width: 20 },
    confidence: 0.75,
    notes: 'Test notes',
  };

  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders module correction form', () => {
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Module #1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Maths')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Make Noise')).toBeInTheDocument();
  });

  it('displays confidence badge', () => {
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/medium confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });

  it('shows high confidence badge for confidence >= 0.8', () => {
    const highConfidenceModule = { ...mockModule, confidence: 0.95 };

    render(
      <ModuleCorrectionPanel
        module={highConfidenceModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
  });

  it('shows low confidence badge for confidence < 0.5', () => {
    const lowConfidenceModule = { ...mockModule, confidence: 0.35 };

    render(
      <ModuleCorrectionPanel
        module={lowConfidenceModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  it('calls onCancel when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('allows editing module name', async () => {
    const user = userEvent.setup();
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/module name/i) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Plaits');

    expect(nameInput.value).toBe('Plaits');
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/module name/i);
    await user.clear(nameInput);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/module name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with updated module data', async () => {
    const user = userEvent.setup();
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/module name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Plaits');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Plaits',
          manufacturer: 'Make Noise',
          confidence: 0.75,
        }),
        0
      );
    });
  });

  it('disables save button when form is pristine', () => {
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it('shows delete confirmation on first click', async () => {
    const user = userEvent.setup();
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteButton);

    expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete on second confirmation click', async () => {
    const user = userEvent.setup();
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteButton);
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(0);
    });
  });

  it('displays help text about AI training', () => {
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/your corrections help improve our ai/i)).toBeInTheDocument();
  });

  it('allows adding notes', async () => {
    const user = userEvent.setup();
    render(
      <ModuleCorrectionPanel
        module={mockModule}
        moduleIndex={0}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const notesInput = screen.getByLabelText(/notes/i);
    await user.clear(notesInput);
    await user.type(notesInput, 'New observation');

    expect(notesInput).toHaveValue('New observation');
  });
});
