import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreditRequestWizard from '../CreditRequestWizard';

// Mock del servicio creditRequestService
const mockCreateCreditRequest = jest.fn();
jest.mock('../../../services/creditRequestService', () => ({
  __esModule: true,
  default: {
    createCreditRequest: (...args) => mockCreateCreditRequest(...args)
  }
}));

// Mock de SweetAlert2
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
    creditType: 'Crédito Personal',
    useOfMoney: 'Gastos Personales',
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

  it('should render the wizard with initial step (Personal Data)', () => {
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    expect(screen.getByText(/Solicitud de Crédito/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Juan Pérez/i)).toBeInTheDocument();
  });

  it('should show error when fullName is empty', async () => {
    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    const nextButton = screen.getByRole('button', { name: /Siguiente/i });
    
    // Intentar avanzar sin llenar el nombre
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/El nombre completo es requerido/i)).toBeInTheDocument();
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

    // Llenar nombre pero no email
    const nameInput = screen.getByPlaceholderText(/Juan Pérez/i);
    await user.type(nameInput, 'Juan Pérez');

    const nextButton = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/El email es requerido/i)).toBeInTheDocument();
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

    const nameInput = screen.getByPlaceholderText(/Juan Pérez/i);
    const emailInput = screen.getByPlaceholderText(/correo@ejemplo.com/i);
    
    await user.type(nameInput, 'Juan Pérez');
    await user.type(emailInput, 'correo-invalido'); // Email sin formato correcto

    const nextButton = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/El email no es válido/i)).toBeInTheDocument();
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

    const nameInput = screen.getByPlaceholderText(/Juan Pérez/i);
    const idInput = screen.getByPlaceholderText(/PEGJ850315/i);
    const emailInput = screen.getByPlaceholderText(/correo@ejemplo.com/i);
    
    await user.type(nameInput, 'Juan Pérez');
    await user.type(idInput, '1234567890');
    await user.type(emailInput, 'juan@example.com');

    const nextButton = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/El teléfono es requerido/i)).toBeInTheDocument();
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

    // Llenar todos los campos requeridos del paso 1
    const nameInput = screen.getByPlaceholderText(/Juan Pérez/i);
    const idInput = screen.getByPlaceholderText(/PEGJ850315/i);
    const emailInput = screen.getByPlaceholderText(/correo@ejemplo.com/i);
    const phoneInput = screen.getByPlaceholderText(/55 1234/i);
    const addressInput = screen.getByPlaceholderText(/Calle, Número/i);
    
    await user.type(nameInput, 'Juan Pérez');
    await user.type(idInput, '1234567890');
    await user.type(emailInput, 'juan@example.com');
    await user.type(phoneInput, '5551234567');
    await user.type(addressInput, 'Calle Principal 123');

    const nextButton = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Información Financiera/i)).toBeInTheDocument();
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

    // Completar paso 1
    await user.type(screen.getByPlaceholderText(/Juan Pérez/i), 'Juan Pérez');
    await user.type(screen.getByPlaceholderText(/PEGJ850315/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/correo@ejemplo.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/55 1234/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Calle, Número/i), 'Calle Principal 123');
    
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Información Financiera/i)).toBeInTheDocument();
    });

    // Ingresar salario negativo o cero
    const salaryInputs = screen.getAllByRole('spinbutton');
    const salaryInput = salaryInputs.find(input => input.name === 'monthlySalary');
    
    await user.clear(salaryInput);
    await user.type(salaryInput, '0');

    const nextButton = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/El salario mensual debe ser mayor a 0/i)).toBeInTheDocument();
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

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
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

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
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

    // Completar paso 1 y avanzar
    await user.type(screen.getByPlaceholderText(/Juan Pérez/i), 'Juan Pérez');
    await user.type(screen.getByPlaceholderText(/PEGJ850315/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/correo@ejemplo.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/55 1234/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Calle, Número/i), 'Calle Principal 123');
    
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Información Financiera/i)).toBeInTheDocument();
    });

    // Volver al paso 1
    const backButton = screen.getByRole('button', { name: /Anterior/i });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Juan Pérez/i)).toBeInTheDocument();
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

    // Completar paso 1
    await user.type(screen.getByPlaceholderText(/Juan Pérez/i), 'Juan Pérez');
    await user.type(screen.getByPlaceholderText(/PEGJ850315/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/correo@ejemplo.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/55 1234/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Calle, Número/i), 'Calle Principal 123');
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Información Financiera/i)).toBeInTheDocument();
    });

    // Completar paso 2 (ya tiene valores por defecto del calculatorData)
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Confirmación de Solicitud/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Confirmar y Enviar/i });
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
      error: 'Error en el servidor'
    });

    render(
      <CreditRequestWizard
        isOpen={true}
        onClose={mockOnClose}
        calculatorData={mockCalculatorData}
      />
    );

    // Completar todos los pasos
    await user.type(screen.getByPlaceholderText(/Juan Pérez/i), 'Juan Pérez');
    await user.type(screen.getByPlaceholderText(/PEGJ850315/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/correo@ejemplo.com/i), 'juan@example.com');
    await user.type(screen.getByPlaceholderText(/55 1234/i), '5551234567');
    await user.type(screen.getByPlaceholderText(/Calle, Número/i), 'Calle Principal 123');
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Información Financiera/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Confirmación de Solicitud/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Confirmar y Enviar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSwalFire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          text: expect.stringContaining('Error en el servidor')
        })
      );
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
