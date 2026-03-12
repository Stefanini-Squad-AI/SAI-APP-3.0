import { useState, useEffect, useCallback } from 'react';
import creditTypeService from '../services/creditTypeService';

const getSafeTermYears = (currentYears, minTermMonths, maxTermMonths) => {
  const minYears = Math.ceil(minTermMonths / 12);
  const maxYears = Math.floor(maxTermMonths / 12);

  // Normal case: there is at least one full-year value inside the allowed month range.
  if (minYears <= maxYears) {
    return Math.min(Math.max(currentYears, minYears), maxYears);
  }

  // Edge case: no exact year exists in the month range (e.g. 7-11 or 13-23 months).
  // Pick a deterministic nearest value to avoid oscillation loops.
  const lowerCandidate = Math.max(1, maxYears);
  const upperCandidate = Math.max(1, minYears);
  const targetYears = (minTermMonths + maxTermMonths) / 24;

  const lowerDistance = Math.abs(lowerCandidate - targetYears);
  const upperDistance = Math.abs(upperCandidate - targetYears);

  return lowerDistance <= upperDistance ? lowerCandidate : upperCandidate;
};

const useCreditCalculator = () => {
  const [creditTypes, setCreditTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreditTypeId, setSelectedCreditTypeId] = useState(null);
  const [selectedCreditType, setSelectedCreditType] = useState(null);
  const [useOfMoney, setUseOfMoney] = useState('consolidation');
  const [monthlyIncome, setMonthlyIncome] = useState(15000);
  const [requestedAmount, setRequestedAmount] = useState(50000);
  const [termYears, setTermYears] = useState(3);
  const [interestRate, setInterestRate] = useState(18);

  const [results, setResults] = useState({
    maxFinancing: 0,
    monthlyPayment: 0,
    appliedRate: 0,
    totalPayment: 0,
    totalInterest: 0
  });

  useEffect(() => {
    const loadCreditTypes = async () => {
      try {
        setLoading(true);
        const data = await creditTypeService.getAll(true);
        setCreditTypes(data);

        if (data.length > 0) {
          setSelectedCreditTypeId(data[0].id);
          setSelectedCreditType(data[0]);
          setInterestRate(data[0].baseInterestRate);
          setRequestedAmount((prevAmount) => Math.min(prevAmount, data[0].maxAmount));
        }
      } catch (error) {
        console.error('Error loading credit types:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreditTypes();
  }, []);

  useEffect(() => {
    if (selectedCreditTypeId && creditTypes.length > 0) {
      const creditType = creditTypes.find(ct => ct.id === selectedCreditTypeId);
      if (creditType) {
        setSelectedCreditType(creditType);
        setInterestRate(creditType.baseInterestRate);

        setRequestedAmount((prevAmount) => Math.min(prevAmount, creditType.maxAmount));
        setTermYears((prevYears) => getSafeTermYears(
          prevYears,
          creditType.minTermMonths,
          creditType.maxTermMonths
        ));
      }
    }
  }, [selectedCreditTypeId, creditTypes]);

  // Max affordable amount based on income: monthly payment capped at 35% of income
  const calculateMaxFinancing = useCallback((income) => {
    if (!selectedCreditType) return 0;

    const maxMonthlyPayment = income * 0.35;
    const rate = selectedCreditType.baseInterestRate;
    const monthlyRate = rate / 12 / 100;
    const numberOfPayments = termYears * 12;

    // Inverse French amortization formula: solve for P given fixed payment M
    if (monthlyRate === 0) {
      return Math.min(maxMonthlyPayment * numberOfPayments, selectedCreditType.maxAmount);
    }

    const maxAmount = maxMonthlyPayment *
      ((Math.pow(1 + monthlyRate, numberOfPayments) - 1) /
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)));

    return Math.min(Math.floor(maxAmount), selectedCreditType.maxAmount);
  }, [selectedCreditType, termYears]);

  // French amortization formula: M = P * (r * (1+r)^n) / ((1+r)^n - 1)
  const calculateMonthlyPayment = (principal, annualRate, years) => {
    const monthlyRate = annualRate / 12 / 100;
    const numberOfPayments = years * 12;

    if (monthlyRate === 0) return principal / numberOfPayments;

    return principal *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  useEffect(() => {
    if (!selectedCreditType || loading) return;

    const maxFinancing = calculateMaxFinancing(monthlyIncome);
    const effectiveAmount = Math.min(requestedAmount, maxFinancing);
    const monthlyPayment = calculateMonthlyPayment(effectiveAmount, interestRate, termYears);
    const totalPayment = monthlyPayment * termYears * 12;
    const totalInterest = totalPayment - effectiveAmount;

    setResults({
      maxFinancing,
      monthlyPayment,
      appliedRate: interestRate,
      totalPayment,
      totalInterest
    });
  }, [selectedCreditType, monthlyIncome, requestedAmount, termYears, interestRate, loading, calculateMaxFinancing]);

  return {
    creditTypes,
    loading,
    selectedCreditTypeId,
    selectedCreditType,
    useOfMoney,
    monthlyIncome,
    requestedAmount,
    termYears,
    interestRate,
    results,
    setSelectedCreditTypeId,
    setUseOfMoney,
    setMonthlyIncome,
    setRequestedAmount,
    setTermYears,
    setInterestRate
  };
};

export default useCreditCalculator;
