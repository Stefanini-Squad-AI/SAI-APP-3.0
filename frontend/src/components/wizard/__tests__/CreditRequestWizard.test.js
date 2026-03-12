import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreditRequestWizard from '../CreditRequestWizard';

// Mock creditRequestService
const mockCreateCreditRequest = jest.fn();
jest.mock('../../../services/creditRequestService', () => ({
  __esModule: true,
  default: {
    createCreditRequest: (...args) => mockCreateCreditRequest(...args)
  }
}));

// Mock SweetAlert2
const mockSwalFire = jest.fn().mockResolvedValue({ isConfirmed: true });
jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: (...args) => mockSwalFire(...args)
  }
}));

describe('CreditRequestWizard - Form Validations', () => {
  const mockOnClose = jest.fn();
  const mockCalculatorData = {
    creditType: 'Personal Credit',
    useOfMoney: 'Personal Expenses',
    requestedAmount: 50000,
    termYears: 3,
    monthlyIncome: 15000,
    interestRate: 18,
    results: {
      monthlyPayment: 1807.80,
      totalPayment: 65080.80,
      totalInterest: 15080.80
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSwalFire.mockResolvedValue({ isConfirmed: true });
  });

  it('should render the wizard with initial step (personal data)', () => {
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    expect(screen.getByText(/Credit Application/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/John Doe/i)).toBeInTheDocument();
  });

  it('should show error when fullName is empty', async () => {
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    const nextButton = screen.getByRole('button', { name: /Next/i });

    // Try advancing without entering a name
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    });
  });

  it('should show error when email is empty', async () => {
    const user = userEvent.setup();
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    // Fill name but leave email empty
    const nameInput = screen.getByPlaceholderText(/John Doe/i);
    await user.type(nameInput, 'John Doe');

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    const nameInput = screen.getByPlaceholderText(/John Doe/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'invalid-email'); // Invalid email format

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should show error when phone is empty', async () => {
    const user = userEvent.setup();
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    const nameInput = screen.getByPlaceholderText(/John Doe/i);
    const idInput = screen.getByPlaceholderText(/National ID \/ Passport/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    
    await user.type(nameInput, 'John Doe');
    await user.type(idInput, '1234567890');
    await user.type(emailInput, 'juan@example.com');

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Phone number is required/i)).toBeInTheDocument();
    });
  });

  it('should advance to step 2 when personal data is valid', async () => {
    const user = userEvent.setup();
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    // Fill all required fields from step 1
    const nameInput = screen.getByPlaceholderText(/John Doe/i);
    const idInput = screen.getByPlaceholderText(/National ID \/ Passport/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const phoneInput = screen.getByPlaceholderText(/\+1 555 0100/i);
    const addressInput = screen.getByPlaceholderText(/Street, Number/i);
    
    await user.type(nameInput, 'John Doe');
    await user.type(idInput, '1234567890');
    await user.type(emailInput, 'juan@example.com');
    await user.type(phoneInput, '5551234567');
    await user.type(addressInput, 'Main Street 123');

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Financial Information/i)).toBeInTheDocument();
    });
  });

  it('should validate positive monthly salary', async () => {
    const user = userEvent.setup();
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    // Complete step 1
    await user.type(screen.getByPlaceholderText(/John Doe/i), 'John Doe');
    await user.type(screen.getByPlaceholderText(/National ID \/ Passport/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/\+1 555 0100/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Street, Number/i), 'Main Street 123');
    
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Financial Information/i)).toBeInTheDocument();
    });

    // Enter a non-positive salary
    const salaryInputs = screen.getAllByRole('spinbutton');
    const salaryInput = salaryInputs.find(input => input.name === 'monthlySalary');
    
    await user.clear(salaryInput);
    await user.type(salaryInput, '0');

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Monthly salary must be greater than 0/i)).toBeInTheDocument();
    });
  });

  it('should call onClose when clicking cancel and user confirms', async () => {
    mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should not call onClose when clicking cancel if user cancels confirmation', async () => {
    mockSwalFire.mockResolvedValueOnce({ isConfirmed: false });
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockSwalFire).toHaveBeenCalled();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should allow navigation back to previous step', async () => {
    const user = userEvent.setup();
    
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    // Complete step 1 and advance
    await user.type(screen.getByPlaceholderText(/John Doe/i), 'John Doe');
    await user.type(screen.getByPlaceholderText(/National ID \/ Passport/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/\+1 555 0100/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Street, Number/i), 'Main Street 123');
    
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Financial Information/i)).toBeInTheDocument();
    });

    // Return to step 1
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/John Doe/i)).toBeInTheDocument();
    });
  });

  it('should submit form successfully when all data is valid', async () => {
    const user = userEvent.setup();
    
    mockCreateCreditRequest.mockResolvedValue({
      success: true,
      data: { id: '123', status: 'Pending' }
    });

    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    // Complete step 1
    await user.type(screen.getByPlaceholderText(/John Doe/i), 'John Doe');
    await user.type(screen.getByPlaceholderText(/National ID \/ Passport/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/\+1 555 0100/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Street, Number/i), 'Main Street 123');
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Financial Information/i)).toBeInTheDocument();
    });

    // Complete step 2 (defaults come from calculatorData)
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Review & Confirm/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Confirm & Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCreditRequest).toHaveBeenCalled();
      expect(mockSwalFire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'success'
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle submission error', async () => {
    const user = userEvent.setup();
    
    mockCreateCreditRequest.mockResolvedValue({
      success: false,
      error: 'Server error'
    });

    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    // Complete all steps
    await user.type(screen.getByPlaceholderText(/John Doe/i), 'John Doe');
    await user.type(screen.getByPlaceholderText(/National ID \/ Passport/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/\+1 555 0100/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Street, Number/i), 'Main Street 123');
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Financial Information/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Review & Confirm/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Confirm & Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSwalFire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          text: expect.stringContaining('Server error')
        })
      );
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
