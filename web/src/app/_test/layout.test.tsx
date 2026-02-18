import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Layout from '../layout';

// Mock the Google Font
vi.mock('next/font/google', () => ({
  Inter: () => ({
    variable: '--font-inter',
    subsets: ['latin'],
  }),
}));

// Mock CSS imports
vi.mock('./globals.css', () => ({}));

describe('RootLayout', () => {
  it('renders the logo icon', () => {
    // Render the layout
    render(
      <Layout>
        <div data-testid="test-child">Content</div>
      </Layout>
    );

    // Find the image
    const logo = screen.getByAltText('logo');
    expect(logo).toBeInTheDocument();
  });
});

describe("RootLayout", () => {
  it('logo links to the correct page', () => {
    render(<Layout><div>child</div></Layout>);

    // Finds the <a> tag inside the button
    const logoLink = screen.getByRole('link', { name: /logo/i });

    expect(logoLink).toHaveAttribute('href', '/');  
  });
});

describe('RootLayout', () => {
  it('renders the title icon', () => {
    // Render the layout
    render(
      <Layout>
        <div data-testid="test-child">Content</div>
      </Layout>
    );

    // Find the title
    const title = screen.getByText("Repo Racoon");
    expect(title).toBeInTheDocument();
  });
});

describe("RootLayout", () => {
  it("renders the signup button", () => {
    // Render signup button
    render(
      <Layout>
        <div data-testid="test-child">Content</div>
      </Layout>
    );
    
    // Find the signup button
    const signUpBtn = screen.getByRole('button', { name: /sign up/i });
    expect(signUpBtn).toBeInTheDocument();
  });
});

describe("RootLayout", () => {
  it('links to the correct signup page', () => {
    render(<Layout><div>child</div></Layout>);

    // Finds the <a> tag inside the button
    const signUpLink = screen.getByRole('link', { name: /sign up/i });

    expect(signUpLink).toHaveAttribute('href', '/signup');  
  });
});

describe("RootLayout", () => {
  it("renders the Log in button", () => {
    // Render login button
    render(
      <Layout>
        <div data-testid="test-child">Content</div>
      </Layout>
    );
    
    // Find the login button
    const logInBtn = screen.getByRole('button', { name: /log in/i });
    expect(logInBtn).toBeInTheDocument();

  });
});

describe("RootLayout", () => {
  it('links to the correct login page', () => {
    render(<Layout><div>child</div></Layout>);

    // Finds the <a> tag inside the button
    const logInLink = screen.getByRole('link', { name: /log in/i });

    expect(logInLink).toHaveAttribute('href', '/login');  
  });
});