import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RestaurantSelector } from '@/components/auth/restaurant-selector';
import { apiClient } from '@/lib/api-client';

// Mock dependencies
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockRestaurants = [
  { id: 'r1', name: 'Downtown Branch', timezone: 'UTC', franchiseGroupId: 'fg1' },
  { id: 'r2', name: 'Uptown Branch', timezone: 'UTC', franchiseGroupId: 'fg1' },
];

describe('RestaurantSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(apiClient).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<RestaurantSelector />);
    expect(screen.getByText('Loading your access...')).toBeInTheDocument();
  });

  it('renders a list of restaurants and allows selection', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({ data: mockRestaurants });
    
    render(<RestaurantSelector />);
    
    await waitFor(() => {
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      expect(screen.getByText('Uptown Branch')).toBeInTheDocument();
    });
    
    // Simulate API call for selection
    vi.mocked(apiClient).mockResolvedValueOnce({});
    
    const downtownButton = screen.getByText('Downtown Branch').closest('button');
    fireEvent.click(downtownButton!);
    
    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/auth/select-restaurant', { method: 'POST' });
    });
  });

  it('displays error if no restaurants are returned', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({ data: [] });
    
    render(<RestaurantSelector />);
    
    await waitFor(() => {
      expect(screen.getByText(/You do not have access to any restaurants/)).toBeInTheDocument();
    });
  });
});
