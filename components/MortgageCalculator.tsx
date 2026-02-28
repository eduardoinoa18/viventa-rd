// components/MortgageCalculator.tsx
'use client';

import { useState, useMemo } from 'react';
import { FiChevronDown, FiChevronUp, FiShare2, FiDownload } from 'react-icons/fi';

interface MortgageCalculatorProps {
  defaultPrice: number;
  currency?: 'USD' | 'DOP';
  className?: string;
}

interface MortgageResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  principal: number;
  amortizationSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

export default function MortgageCalculator({ 
  defaultPrice, 
  currency = 'USD',
  className = '' 
}: MortgageCalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [price, setPrice] = useState(defaultPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8);
  const [loanTerm, setLoanTerm] = useState(20);
  const [showAmortization, setShowAmortization] = useState(false);
  
  // Calculate mortgage (memoized for performance)
  const result = useMemo(() => 
    calculateFullMortgage(price, downPaymentPercent, interestRate, loanTerm),
    [price, downPaymentPercent, interestRate, loanTerm]
  );
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  if (!isExpanded) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 my-8 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧮</span>
            <div>
              <h3 className="text-xl font-bold text-[#0B2545] group-hover:text-[#00A6A6] transition">
                Calculadora de Hipoteca
              </h3>
              <p className="text-gray-600 text-sm">
                Calcula tu pago mensual personalizado
              </p>
            </div>
          </div>
          <FiChevronDown className="text-2xl text-gray-400 group-hover:text-[#00A6A6] transition" />
        </button>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 md:p-8 my-8 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(false)}
        className="w-full flex items-center justify-between text-left mb-6 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧮</span>
          <h3 className="text-xl font-bold text-[#0B2545] group-hover:text-[#00A6A6] transition">
            Calculadora de Hipoteca
          </h3>
        </div>
        <FiChevronUp className="text-2xl text-gray-400 group-hover:text-[#00A6A6] transition" />
      </button>
      
      {/* Inputs */}
      <div className="space-y-6">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="mortgage-price">
            Precio de la propiedad
          </label>
          <input
            id="mortgage-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
            step="1000"
            min="0"
          />
        </div>
        
        {/* Down Payment % */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="mortgage-downPaymentPercent">
            Inicial: {downPaymentPercent}% ({formatCurrency(price * downPaymentPercent / 100)})
          </label>
          <input
            id="mortgage-downPaymentPercent"
            type="range"
            min="5"
            max="80"
            step="5"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00A6A6]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5%</span>
            <span>80%</span>
          </div>
        </div>
        
        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="mortgage-interestRate">
            Tasa de interés: {interestRate.toFixed(1)}%
          </label>
          <input
            id="mortgage-interestRate"
            type="range"
            min="2"
            max="30"
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00A6A6]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2%</span>
            <span>30%</span>
          </div>
        </div>
        
        {/* Loan Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plazo del préstamo
          </label>
          <div className="grid grid-cols-6 gap-2">
            {[1, 5, 10, 15, 20, 30].map((years) => (
              <button
                key={years}
                onClick={() => setLoanTerm(years)}
                className={`py-2 rounded-lg font-medium transition ${
                  loanTerm === years
                    ? 'bg-[#00A6A6] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {years}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">años</p>
        </div>
      </div>
      
      {/* Results */}
      <div className="mt-8 bg-gradient-to-br from-[#0B2545] to-[#00A6A6] rounded-xl p-6 text-white">
        <div className="text-center mb-4">
          <div className="text-sm text-white/80 mb-1">Pago mensual estimado</div>
          <div className="text-4xl font-bold">
            {formatCurrency(result.monthlyPayment)}
          </div>
          <div className="text-xs text-white/70 mt-1">
            por {loanTerm} años
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-white/20 pt-4">
          <div>
            <div className="text-white/70">Monto del préstamo</div>
            <div className="font-semibold">{formatCurrency(result.principal)}</div>
          </div>
          <div>
            <div className="text-white/70">Interés total</div>
            <div className="font-semibold">{formatCurrency(result.totalInterest)}</div>
          </div>
          <div>
            <div className="text-white/70">Total a pagar</div>
            <div className="font-semibold">{formatCurrency(result.totalPaid)}</div>
          </div>
          <div>
            <div className="text-white/70">LTV Ratio</div>
            <div className="font-semibold">{(100 - downPaymentPercent).toFixed(0)}%</div>
          </div>
        </div>
      </div>
      
      {/* Amortization toggle */}
      <button
        onClick={() => setShowAmortization(!showAmortization)}
        className="w-full mt-4 py-3 text-[#00A6A6] font-medium hover:bg-gray-50 rounded-lg transition flex items-center justify-center gap-2"
      >
        {showAmortization ? 'Ocultar' : 'Ver'} tabla de amortización
        {showAmortization ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      
      {/* Amortization table (first 12 months preview) */}
      {showAmortization && (
        <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Mes</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Pago</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Principal</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Interés</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Balance</th>
              </tr>
            </thead>
            <tbody>
              {result.amortizationSchedule.slice(0, 12).map((row) => (
                <tr key={row.month} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{row.month}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(row.payment)}</td>
                  <td className="px-4 py-2 text-right text-green-600 font-medium">{formatCurrency(row.principal)}</td>
                  <td className="px-4 py-2 text-right text-red-600">{formatCurrency(row.interest)}</td>
                  <td className="px-4 py-2 text-right text-gray-700 font-medium">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 py-3 text-center bg-gray-50">
            Mostrando primeros 12 meses de {loanTerm * 12} total
          </p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <button 
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
          onClick={() => {
            // TODO: Implement share functionality
            alert('Función de compartir próximamente');
          }}
        >
          <FiShare2 />
          Compartir
        </button>
        <button 
          className="flex-1 py-3 bg-[#00A6A6] text-white rounded-lg font-medium hover:bg-[#008C8C] transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          onClick={() => {
            // TODO: Implement download PDF functionality
            alert('Descarga de PDF próximamente');
          }}
        >
          <FiDownload />
          Descargar PDF
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        * Esta es una estimación. Consulta con tu banco para tasas y términos exactos.
      </p>
    </div>
  );
}

// Helper function
function calculateFullMortgage(
  price: number,
  downPaymentPercent: number,
  annualInterestRate: number,
  years: number
): MortgageResult {
  const downPayment = price * (downPaymentPercent / 100);
  const principal = price - downPayment;
  const monthlyRate = annualInterestRate / 100 / 12;
  const months = years * 12;
  
  // Handle zero interest rate edge case
  if (monthlyRate === 0) {
    const monthlyPayment = principal / months;
    const schedule = Array.from({ length: months }, (_, i) => ({
      month: i + 1,
      payment: monthlyPayment,
      principal: monthlyPayment,
      interest: 0,
      balance: principal - (monthlyPayment * (i + 1))
    }));
    
    return {
      monthlyPayment,
      totalInterest: 0,
      totalPaid: principal,
      principal,
      amortizationSchedule: schedule
    };
  }
  
  const monthlyPayment = 
    principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  const schedule: MortgageResult['amortizationSchedule'] = [];
  let balance = principal;
  let totalInterest = 0;
  
  for (let month = 1; month <= months; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;
    
    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance)
    });
  }
  
  const totalPaid = monthlyPayment * months;
  
  return {
    monthlyPayment,
    totalInterest,
    totalPaid,
    principal,
    amortizationSchedule: schedule
  };
}
