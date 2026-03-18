import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es' },
  }),
}));

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe('Footer', () => {
  it('includes a link to the legal information page in the Legal section', () => {
    renderWithRouter();
    const legalInfoLink = screen.getByRole('link', { name: 'footer.legalInfo' });
    expect(legalInfoLink).toBeInTheDocument();
    expect(legalInfoLink).toHaveAttribute('href', '/legal');
  });

  it('keeps existing legal links (privacy, terms)', () => {
    renderWithRouter();
    expect(screen.getByRole('link', { name: 'footer.privacyPolicy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'footer.termsConditions' })).toHaveAttribute('href', '/terms');
  });
});
