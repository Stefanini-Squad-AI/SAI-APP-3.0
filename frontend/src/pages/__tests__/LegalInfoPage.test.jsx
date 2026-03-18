import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LegalInfoPage from '../LegalInfoPage';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es' },
  }),
}));

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <LegalInfoPage />
    </MemoryRouter>
  );

describe('LegalInfoPage', () => {
  it('renders the page with hero title and last updated', () => {
    renderWithRouter();
    expect(screen.getByText('legalInfoPage.title')).toBeInTheDocument();
    expect(screen.getByText('legalInfoPage.lastUpdated')).toBeInTheDocument();
  });

  it('renders content sections with titles and body', () => {
    renderWithRouter();
    expect(screen.getByText('legalInfoPage.s1title')).toBeInTheDocument();
    expect(screen.getByText('legalInfoPage.s2title')).toBeInTheDocument();
    expect(screen.getByText('legalInfoPage.s3title')).toBeInTheDocument();
  });

  it('renders link to contact and back home', () => {
    renderWithRouter();
    const contactLink = screen.getByRole('link', { name: /legalInfoPage.contactUs/i });
    expect(contactLink).toHaveAttribute('href', '/contact');
    const backLink = screen.getByRole('link', { name: /notFoundPage.backHome/i });
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('has correct heading structure (h1 for title)', () => {
    renderWithRouter();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('legalInfoPage.title');
  });
});
