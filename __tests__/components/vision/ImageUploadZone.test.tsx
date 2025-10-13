import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImageUploadZone } from '@/components/vision/ImageUploadZone';

// Mock browser-image-compression
jest.mock('browser-image-compression', () => {
  return jest.fn((file) => Promise.resolve(file));
});

// Mock canvas-confetti
jest.mock('canvas-confetti', () => {
  return jest.fn();
});

describe('ImageUploadZone', () => {
  const mockOnImageUploaded = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
  });

  it('renders upload zone with instructions', () => {
    render(<ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} />);

    expect(screen.getByText(/drag & drop your rack photo/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse files/i)).toBeInTheDocument();
  });

  it('shows accepted formats and size limit', () => {
    render(<ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} />);

    expect(screen.getByText(/JPG, PNG, WebP/i)).toBeInTheDocument();
    expect(screen.getByText(/10MB/i)).toBeInTheDocument();
  });

  it('displays custom max size when provided', () => {
    render(
      <ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} maxSizeMB={5} />
    );

    expect(screen.getByText(/5MB/i)).toBeInTheDocument();
  });

  it('handles file upload and calls onImageUploaded', async () => {
    const user = userEvent.setup();
    render(<ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} />);

    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnImageUploaded).toHaveBeenCalledWith(
        expect.any(File),
        expect.stringMatching(/blob:/)
      );
    });
  });

  it('shows preview after upload', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} />
    );

    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      const img = container.querySelector('img[alt="Rack preview"]');
      expect(img).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  it('shows error for files that are too large', async () => {
    const user = userEvent.setup();
    render(
      <ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} maxSizeMB={1} />
    );

    // Create a 2MB file (larger than 1MB limit)
    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('2.0MB'));
    });

    expect(mockOnImageUploaded).not.toHaveBeenCalled();
  });

  it('allows removing uploaded image', async () => {
    const user = userEvent.setup();
    render(<ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} />);

    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove image/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
      expect(screen.getByText(/drag & drop your rack photo/i)).toBeInTheDocument();
    });
  });

  it('shows success message when image is ready', async () => {
    const user = userEvent.setup();
    render(<ImageUploadZone onImageUploaded={mockOnImageUploaded} onError={mockOnError} />);

    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/image ready for analysis/i)).toBeInTheDocument();
    });
  });
});
