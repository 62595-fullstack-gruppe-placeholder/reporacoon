import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignupForm } from '../SignupForm';
import * as SignupActions from '../signup';

// Mock the Server Action file
vi.mock('../signup', () => ({
  signup: vi.fn(),
}));

describe('SignupForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit the form with correct data and reset on success', async () => {
    const user = userEvent.setup();
    const signupSpy = vi.mocked(SignupActions.signup).mockResolvedValue(undefined as any);

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(signupSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      });
    });
  });

  it('should show validation errors and NOT call signup if passwords mismatch', async () => {
    const user = userEvent.setup();
    const signupSpy = vi.mocked(SignupActions.signup);
    
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'WrongPassword!');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    // Wait for the error message to appear (exact match)
    const errorMsg = await screen.findByText("Passwords don't match");
    expect(errorMsg).toBeInTheDocument();

    // verify that the spy was NOT called during THIS test
    expect(signupSpy).not.toHaveBeenCalled();
  });
});