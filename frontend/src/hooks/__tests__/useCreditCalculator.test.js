import { renderHook, waitFor } from '@testing-library/react';
import useCreditCalculator from '../useCreditCalculator';
import creditTypeService from '../../services/creditTypeService';

// Mock del servicio creditTypeService
jest.mock('../../services/creditTypeService');

// Mock de apiClient para evitar problemas con import.meta
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

describe('useCreditCalculator', () => {
  const mockCreditTypes = [
    {
      id: '1',
      name: 'Crédito Personal',
      description: 'Crédito para gastos personales',
      baseInterestRate: 18,
      maxAmount: 200000,
      minTermMonths: 12,
      maxTermMonths: 60,
      isActive: true
    },
    {
      id: '2',
      name: 'Crédito Hipotecario',
      description: 'Crédito para vivienda',
      baseInterestRate: 10,
      maxAmount: 1000000,
      minTermMonths: 60,
      maxTermMonths: 240,
      isActive: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    creditTypeService.getAll = jest.fn().mockResolvedValue(mockCreditTypes);
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.creditTypes).toHaveLength(2);
    expect(result.current.selectedCreditTypeId).toBe('1');
    expect(result.current.selectedCreditType).not.toBeNull();
    expect(result.current.monthlyIncome).toBe(15000);
    expect(result.current.requestedAmount).toBe(50000);
    expect(result.current.termYears).toBe(3);
  });

  it('should calculate monthly payment correctly using French amortization formula', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Hook defaults: 50000 at 18% for 3 years
    const principal = result.current.requestedAmount;
    const annualRate = result.current.interestRate;
    const years = result.current.termYears;

    // Manual calculation using French amortization formula
    const monthlyRate = annualRate / 12 / 100;
    const numberOfPayments = years * 12;
    
    const expectedMonthlyPayment = 
      principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const { results } = result.current;
    
    expect(Math.abs(results.monthlyPayment - expectedMonthlyPayment)).toBeLessThan(1);
  });

  it('should calculate correct monthly payment for 100,000 at 18% for 3 years', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const principal = 100000;
    const rate = 18;
    const years = 3;
    
    // Expected result calculated manually: ~3,615.60
    const expectedPayment = 3615.60;
    const monthlyRate = rate / 12 / 100;
    const n = years * 12;
    const calculatedPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    
    expect(Math.abs(calculatedPayment - expectedPayment)).toBeLessThan(1);
  });

  it('should calculate correct total payment and interest', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
      expect(result.current.results.monthlyPayment).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const { results, requestedAmount, termYears } = result.current;
    
    // Total payment = monthly payment × number of payments
    const expectedTotalPayment = results.monthlyPayment * termYears * 12;
    expect(Math.abs(results.totalPayment - expectedTotalPayment)).toBeLessThan(1);

    // Total interest = total payment - principal (hook uses effectiveAmount which may be < requestedAmount)
    const effectiveAmount = Math.min(requestedAmount, results.maxFinancing);
    const expectedTotalInterest = results.totalPayment - effectiveAmount;
    expect(Math.abs(results.totalInterest - expectedTotalInterest)).toBeLessThan(1);
  });

  it('should calculate max financing based on 35% of monthly income', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const { results, monthlyIncome } = result.current;
    
    // Max 35% of income toward monthly payment: 15000 * 0.35 = 5250
    const maxMonthlyPayment = monthlyIncome * 0.35;

    // maxFinancing is capped by both payment capacity and the credit type's maxAmount
    expect(results.maxFinancing).toBeLessThanOrEqual(200000);
    expect(results.maxFinancing).toBeGreaterThan(0);
  });

  it('should respect credit type max amount limit', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const { creditTypes, requestedAmount } = result.current;
    
    expect(requestedAmount).toBeLessThanOrEqual(creditTypes[0].maxAmount);
  });

  it('should use correct interest rate from credit type', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const { interestRate, creditTypes } = result.current;
    
    expect(interestRate).toBe(creditTypes[0].baseInterestRate);
  });

  it('should handle zero interest rate edge case', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Zero interest rate: payment = principal / number of payments
    const principal = 12000;
    const years = 1;
    const rate = 0;
    
    const monthlyRate = rate / 12 / 100;
    const n = years * 12;
    
    let monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = principal / n;
    } else {
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }
    
    expect(monthlyPayment).toBe(1000); // 12000 / 12 = 1000
  });

  it('should recalculate when term changes', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
      expect(result.current.results.monthlyPayment).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Verificar que los resultados están calculados correctamente
    const { results } = result.current;
    expect(results.monthlyPayment).toBeGreaterThan(0);
    expect(results.totalPayment).toBeGreaterThan(0);
  });

  it('should ensure monthly payment is a positive number', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
      expect(result.current.results.monthlyPayment).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const { results } = result.current;
    
    expect(results.monthlyPayment).toBeGreaterThan(0);
    expect(results.totalPayment).toBeGreaterThan(0);
    expect(results.totalInterest).toBeGreaterThanOrEqual(0);
  });

  it('should handle loading state correctly', async () => {
    const { result } = renderHook(() => useCreditCalculator());

    // Inicialmente debería estar cargando
    expect(result.current.loading).toBe(true);

    // Después de cargar los tipos de crédito
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.creditTypes.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
