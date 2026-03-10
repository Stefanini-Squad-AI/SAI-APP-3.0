import { useState, useEffect } from 'react';
import creditTypeService from '../services/creditTypeService';

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
          if (requestedAmount > data[0].maxAmount) {
            setRequestedAmount(data[0].maxAmount);
          }
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

        if (requestedAmount > creditType.maxAmount) {
          setRequestedAmount(creditType.maxAmount);
        }

        const termMonths = termYears * 12;
        if (termMonths > creditType.maxTermMonths) {
          setTermYears(Math.floor(creditType.maxTermMonths / 12));
        } else if (termMonths < creditType.minTermMonths) {
          setTermYears(Math.ceil(creditType.minTermMonths / 12));
        }
      }
    }
  }, [selectedCreditTypeId, creditTypes]);

  // Max affordable amount based on income: monthly payment capped at 35% of income
  const calculateMaxFinancing = (income) => {
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
  };

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
  }, [selectedCreditType, monthlyIncome, requestedAmount, termYears, interestRate, loading]);

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
