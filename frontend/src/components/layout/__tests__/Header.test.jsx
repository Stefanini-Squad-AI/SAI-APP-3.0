import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es' },
  }),
}));

jest.mock('../LanguageSelector', () => () => <div data-testid="language-selector">LanguageSelector</div>);

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe('Header', () => {
  it('includes a navigation link to the legal information page', () => {
    renderWithRouter();
    const legalLink = screen.getByRole('link', { name: 'header.legalInfo' });
    expect(legalLink).toBeInTheDocument();
    expect(legalLink).toHaveAttribute('href', '/legal');
  });

  it('includes contact link next to legal link', () => {
    renderWithRouter();
    const contactLink = screen.getByRole('link', { name: 'header.contact' });
    expect(contactLink).toHaveAttribute('href', '/contact');
  });
});
