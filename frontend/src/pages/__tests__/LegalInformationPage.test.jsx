import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import LegalInformationPage from '../LegalInformationPage';

const renderLegalPage = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/legal']}>
        <Routes>
          <Route path="/legal" element={<LegalInformationPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );

describe('LegalInformationPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the legal hub with two tabs and default privacy panel', () => {
    renderLegalPage();

    expect(screen.getByTestId('legal-information-page')).toBeInTheDocument();
    expect(screen.getByTestId('legal-tab-privacy')).toBeInTheDocument();
    expect(screen.getByTestId('legal-tab-terms')).toBeInTheDocument();

    const privacyPanel = screen.getByTestId('legal-panel-privacy');
    expect(privacyPanel).not.toHaveAttribute('hidden');
    expect(within(privacyPanel).getByTestId('legal-panel-privacy-inner')).toBeVisible();

    const termsPanel = screen.getByTestId('legal-panel-terms');
    expect(termsPanel).toHaveAttribute('hidden');
  });

  it('switches visible panel when activating tabs', async () => {
    const user = userEvent.setup();
    renderLegalPage();

    await user.click(screen.getByTestId('legal-tab-terms'));

    const termsPanel = screen.getByTestId('legal-panel-terms');
    expect(termsPanel).not.toHaveAttribute('hidden');
    expect(within(termsPanel).getByTestId('legal-panel-terms-inner')).toBeVisible();

    expect(screen.getByTestId('legal-panel-privacy')).toHaveAttribute('hidden');
  });
});
