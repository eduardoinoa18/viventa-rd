# LISTING INVESTMENT MODULE
## Technical Specification & Implementation Guide

> **Strategic Purpose**: Transform listing pages from "photo + price" to "investment analysis tool"

**Impact**: Positions Viventa as investor-focused platform, increases time-on-page, drives qualified leads

---

## 🎯 Module Overview

### Components

1. **InvestmentInsightPanel** - Above-fold metrics display
2. **MortgageCalculator** - Interactive payment estimator
3. **WhatsAppFloatingCTA** - Persistent conversion engine

### Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Avg time on listing page | ~1:15 | 2:30+ | Week 2 |
| WhatsApp CTR | ~2% | 8%+ | Week 2 |
| Calculator interaction rate | 0% | 40%+ | Week 3 |
| Bounce rate | ~50% | <35% | Week 3 |

---

## 📊 Component 1: InvestmentInsightPanel

### Purpose
Display key investment metrics at-a-glance to position properties as financial assets, not just homes.

### Location
`components/InvestmentInsightPanel.tsx`

### Props Interface
```typescript
interface InvestmentInsightPanelProps {
  listing: {
    price: number;
    area: number; // square meters
    propertyType: string;
    city: string;
    bedrooms?: number;
    currency?: 'USD' | 'DOP';
  };
  className?: string;
}
```

### Calculations

#### 1. Price Per Square Meter
```typescript
const pricePerSqM = listing.price / listing.area;

// Format with currency
const formatted = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: listing.currency || 'USD',
  maximumFractionDigits: 0
}).format(pricePerSqM);
```

**Display**: `$2,450/m²` or `RD$137,000/m²`

---

#### 2. Estimated Monthly Mortgage Payment

**Assumptions** (customizable in calculator):
- Down payment: 20%
- Interest rate: 8% annual (typical DR rate)
- Loan term: 20 years

**Formula**:
```typescript
function calculateMortgage(
  price: number,
  downPaymentPercent: number = 20,
  annualInterestRate: number = 8,
  years: number = 20
): number {
  const principal = price * (1 - downPaymentPercent / 100);
  const monthlyRate = annualInterestRate / 100 / 12;
  const months = years * 12;
  
  const monthlyPayment = 
    principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  return monthlyPayment;
}
```

**Example**:
- Price: $300,000
- Down payment: $60,000 (20%)
- Principal: $240,000
- Monthly payment: ~$2,006

**Display**: `~$2,006/mes` with footnote "con 20% inicial, 8% interés, 20 años"

---

#### 3. Estimated Rental Yield

**Conservative Model**:
```typescript
function estimateRentalYield(
  price: number,
  bedrooms: number,
  city: string,
  propertyType: string
): { monthlyRent: number; annualYield: number } {
  // Base monthly rent: 0.6% of property price
  // Adjust by city multiplier
  const cityMultipliers: Record<string, number> = {
    'Punta Cana': 1.3,
    'Santo Domingo': 1.0,
    'Santiago': 0.9,
    'Puerto Plata': 1.2,
    'Las Terrenas': 1.25,
    'Samaná': 1.15,
  };
  
  const multiplier = cityMultipliers[city] || 1.0;
  const monthlyRent = price * 0.006 * multiplier;
  
  const annualRent = monthlyRent * 12;
  const annualYield = (annualRent / price) * 100;
  
  return { monthlyRent, annualYield };
}
```

**Example**:
- Price: $300,000
- City: Punta Cana (1.3x multiplier)
- Monthly rent estimate: $2,340
- Annual rent: $28,080
- Gross yield: 9.36%

**Display**: `~$2,340/mes` | `Rendimiento: 9.4%`

---

#### 4. Airbnb Potential Badge

**Logic**:
```typescript
function isAirbnbIdeal(city: string, propertyType: string, bedrooms?: number): boolean {
  const touristCities = [
    'Punta Cana',
    'Puerto Plata',
    'Las Terrenas',
    'Samaná',
    'Cabarete',
    'Bávaro'
  ];
  
  const idealTypes = ['Apartamento', 'Villa', 'Casa', 'Penthouse'];
  
  const isTouristZone = touristCities.some(tc => 
    city.toLowerCase().includes(tc.toLowerCase())
  );
  
  const isIdealType = idealTypes.some(type => 
    propertyType.toLowerCase().includes(type.toLowerCase())
  );
  
  const hasEnoughBedrooms = !bedrooms || bedrooms >= 1;
  
  return isTouristZone && isIdealType && hasEnoughBedrooms;
}
```

**Display**: Badge with "🏖️ Ideal para Airbnb" if conditions met

---

### UI Design

**Desktop Layout** (3-column grid):
```
┌──────────────────────────────────────────────────────┐
│  💰 Precio por m²     📅 Pago mensual    📈 Renta   │
│  $2,450/m²            ~$2,006/mes         ~$2,340    │
│  Competitivo          20% inicial         Rend. 9.4% │
│                                                       │
│  [🏖️ Ideal para Airbnb]                             │
└──────────────────────────────────────────────────────┘
```

**Mobile Layout** (2-column grid, stacked):
```
┌──────────────────────────────────┐
│  💰 Precio por m²   📅 Pago      │
│  $2,450/m²          ~$2,006/mes  │
│                                  │
│  📈 Renta estimada               │
│  ~$2,340/mes | Rend. 9.4%       │
│                                  │
│  [🏖️ Ideal para Airbnb]         │
└──────────────────────────────────┘
```

**Styling**:
- Gradient background: `from-[#00A6A6] to-[#00C8C8]` (teal → cyan)
- White text for readability
- Large numbers (text-2xl font)
- Small explanatory text below (text-sm, opacity-90)
- Rounded-2xl corners
- Shadow-lg for depth
- Padding: p-6 md:p-8
- Margin: my-8

**Icons**:
- Price per m²: `FiDollarSign` (react-icons)
- Monthly payment: `FiCalendar`
- Rental yield: `FiTrendingUp`
- Airbnb badge: Beach emoji 🏖️

---

### Code Implementation

```typescript
// components/InvestmentInsightPanel.tsx
'use client';

import { FiDollarSign, FiCalendar, FiTrendingUp, FiInfo } from 'react-icons/fi';
import { useState } from 'react';

interface InvestmentInsightPanelProps {
  listing: {
    price: number;
    area: number;
    propertyType: string;
    city: string;
    bedrooms?: number;
    currency?: 'USD' | 'DOP';
  };
  className?: string;
}

export default function InvestmentInsightPanel({ listing, className = '' }: InvestmentInsightPanelProps) {
  const currency = listing.currency || 'USD';
  
  // Calculations
  const pricePerSqM = listing.price / listing.area;
  
  const monthlyMortgage = calculateMortgage(listing.price);
  
  const { monthlyRent, annualYield } = estimateRentalYield(
    listing.price,
    listing.bedrooms || 1,
    listing.city,
    listing.propertyType
  );
  
  const showAirbnbBadge = isAirbnbIdeal(
    listing.city,
    listing.propertyType,
    listing.bedrooms
  );
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className={`bg-gradient-to-br from-[#00A6A6] to-[#00C8C8] rounded-2xl shadow-lg p-6 md:p-8 my-8 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          📊 Análisis de Inversión
        </h3>
        <button className="text-white/80 hover:text-white transition">
          <FiInfo className="text-xl" title="Estimaciones basadas en promedios del mercado" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Price per m² */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FiDollarSign className="text-white text-xl" />
            <span className="text-white/90 text-sm font-medium">Precio por m²</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {formatCurrency(pricePerSqM)}/m²
          </div>
          <div className="text-white/70 text-xs mt-1">
            {pricePerSqM > 3000 ? 'Premium' : pricePerSqM > 2000 ? 'Competitivo' : 'Accesible'}
          </div>
        </div>
        
        {/* Monthly mortgage */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FiCalendar className="text-white text-xl" />
            <span className="text-white/90 text-sm font-medium">Pago mensual estimado</span>
          </div>
          <div className="text-white text-2xl font-bold">
            ~{formatCurrency(monthlyMortgage)}/mes
          </div>
          <div className="text-white/70 text-xs mt-1">
            20% inicial, 8% interés, 20 años
          </div>
        </div>
        
        {/* Rental yield */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FiTrendingUp className="text-white text-xl" />
            <span className="text-white/90 text-sm font-medium">Renta estimada</span>
          </div>
          <div className="text-white text-2xl font-bold">
            ~{formatCurrency(monthlyRent)}/mes
          </div>
          <div className="text-white/70 text-xs mt-1">
            Rendimiento bruto: {annualYield.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Airbnb badge */}
      {showAirbnbBadge && (
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/30">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">🏖️</span>
            <span className="font-semibold">Ideal para Airbnb</span>
            <span className="text-white/80 text-sm">
              | Zona turística con alta demanda
            </span>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-white/60 text-xs text-center">
        * Estimaciones basadas en promedios del mercado. Consulta con un asesor para cálculos personalizados.
      </div>
    </div>
  );
}

// Helper functions
function calculateMortgage(
  price: number,
  downPaymentPercent: number = 20,
  annualInterestRate: number = 8,
  years: number = 20
): number {
  const principal = price * (1 - downPaymentPercent / 100);
  const monthlyRate = annualInterestRate / 100 / 12;
  const months = years * 12;
  
  const monthlyPayment = 
    principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  return monthlyPayment;
}

function estimateRentalYield(
  price: number,
  bedrooms: number,
  city: string,
  propertyType: string
): { monthlyRent: number; annualYield: number } {
  const cityMultipliers: Record<string, number> = {
    'Punta Cana': 1.3,
    'Santo Domingo': 1.0,
    'Santiago': 0.9,
    'Puerto Plata': 1.2,
    'Las Terrenas': 1.25,
    'Samaná': 1.15,
  };
  
  const multiplier = cityMultipliers[city] || 1.0;
  const monthlyRent = price * 0.006 * multiplier;
  
  const annualRent = monthlyRent * 12;
  const annualYield = (annualRent / price) * 100;
  
  return { monthlyRent, annualYield };
}

function isAirbnbIdeal(city: string, propertyType: string, bedrooms?: number): boolean {
  const touristCities = [
    'Punta Cana',
    'Puerto Plata',
    'Las Terrenas',
    'Samaná',
    'Cabarete',
    'Bávaro'
  ];
  
  const idealTypes = ['Apartamento', 'Villa', 'Casa', 'Penthouse'];
  
  const isTouristZone = touristCities.some(tc => 
    city.toLowerCase().includes(tc.toLowerCase())
  );
  
  const isIdealType = idealTypes.some(type => 
    propertyType.toLowerCase().includes(type.toLowerCase())
  );
  
  const hasEnoughBedrooms = !bedrooms || bedrooms >= 1;
  
  return isTouristZone && isIdealType && hasEnoughBedrooms;
}
```

---

## 📊 Component 2: MortgageCalculator

### Purpose
Interactive tool that keeps users engaged, provides personalized payment estimates, positions Viventa as financial advisor.

### Location
`components/MortgageCalculator.tsx`

### Props Interface
```typescript
interface MortgageCalculatorProps {
  defaultPrice: number;
  currency?: 'USD' | 'DOP';
  className?: string;
}
```

### Features

1. **Adjustable Inputs** (sliders + number inputs):
   - Property price (pre-filled, editable)
   - Down payment % (10-50%, default 20%)
   - Interest rate % (5-12%, default 8%)
   - Loan term years (10, 15, 20, 25, 30)

2. **Real-Time Outputs**:
   - Monthly payment (large, bold)
   - Total interest over life of loan
   - Total amount paid
   - Loan-to-value ratio

3. **Amortization Preview**:
   - First 12 months breakdown
   - Principal vs interest chart
   - Collapsible full schedule

4. **Export Options**:
   - Share calculation link
   - Download PDF summary
   - WhatsApp pre-filled message

### Calculation Logic

```typescript
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
  
  // Monthly payment using amortization formula
  const monthlyPayment = 
    principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  // Generate amortization schedule
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
```

### UI Design

**Layout** (expandable section):
```
┌──────────────────────────────────────────────────┐
│  🧮 Calculadora de Hipoteca                      │
│  [Expandir/Colapsar]                             │
└──────────────────────────────────────────────────┘

Expanded:
┌──────────────────────────────────────────────────┐
│  Precio de la propiedad                          │
│  [$300,000] ───────●──────                       │
│                                                  │
│  Inicial (%)          Interés (%)                │
│  [20%] ──●──          [8.0%] ──●──              │
│                                                  │
│  Plazo (años)                                    │
│  [10] [15] [●20] [25] [30]                      │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Pago mensual                              │ │
│  │  $2,006                                    │ │
│  │                                            │ │
│  │  Interés total: $241,440                  │ │
│  │  Total a pagar: $481,440                  │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [Ver tabla de amortización ▼]                  │
│                                                  │
│  [Compartir cálculo] [Descargar PDF]            │
└──────────────────────────────────────────────────┘
```

### Code Implementation

```typescript
// components/MortgageCalculator.tsx
'use client';

import { useState, useMemo } from 'react';
import { FiChevronDown, FiChevronUp, FiShare2, FiDownload } from 'react-icons/fi';

interface MortgageCalculatorProps {
  defaultPrice: number;
  currency?: 'USD' | 'DOP';
  className?: string;
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio de la propiedad
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
          />
        </div>
        
        {/* Down Payment % */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inicial: {downPaymentPercent}% ({formatCurrency(price * downPaymentPercent / 100)})
          </label>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full accent-[#00A6A6]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10%</span>
            <span>50%</span>
          </div>
        </div>
        
        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tasa de interés: {interestRate.toFixed(1)}%
          </label>
          <input
            type="range"
            min="5"
            max="12"
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-[#00A6A6]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5%</span>
            <span>12%</span>
          </div>
        </div>
        
        {/* Loan Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plazo del préstamo
          </label>
          <div className="flex gap-2">
            {[10, 15, 20, 25, 30].map((years) => (
              <button
                key={years}
                onClick={() => setLoanTerm(years)}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  loanTerm === years
                    ? 'bg-[#00A6A6] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {years} años
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div className="mt-8 bg-gradient-to-br from-[#0B2545] to-[#00A6A6] rounded-xl p-6 text-white">
        <div className="text-center mb-4">
          <div className="text-sm text-white/80 mb-1">Pago mensual estimado</div>
          <div className="text-4xl font-bold">
            {formatCurrency(result.monthlyPayment)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
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
        Ver tabla de amortización
        {showAmortization ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      
      {/* Amortization table (first 12 months preview) */}
      {showAmortization && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Mes</th>
                <th className="px-4 py-2 text-right">Pago</th>
                <th className="px-4 py-2 text-right">Principal</th>
                <th className="px-4 py-2 text-right">Interés</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {result.amortizationSchedule.slice(0, 12).map((row) => (
                <tr key={row.month} className="border-b">
                  <td className="px-4 py-2">{row.month}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(row.payment)}</td>
                  <td className="px-4 py-2 text-right text-green-600">{formatCurrency(row.principal)}</td>
                  <td className="px-4 py-2 text-right text-red-600">{formatCurrency(row.interest)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Mostrando primeros 12 meses de {loanTerm * 12} total
          </p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2">
          <FiShare2 />
          Compartir
        </button>
        <button className="flex-1 py-3 bg-[#00A6A6] text-white rounded-lg font-medium hover:bg-[#008C8C] transition flex items-center justify-center gap-2">
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

// Helper function (same as before)
function calculateFullMortgage(
  price: number,
  downPaymentPercent: number,
  annualInterestRate: number,
  years: number
) {
  const downPayment = price * (downPaymentPercent / 100);
  const principal = price - downPayment;
  const monthlyRate = annualInterestRate / 100 / 12;
  const months = years * 12;
  
  const monthlyPayment = 
    principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  const schedule = [];
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
```

---

## 📱 Component 3: WhatsAppFloatingCTA

### Purpose
Persistent conversion mechanism optimized for DR market (WhatsApp-first economy).

### Location
`components/WhatsAppFloatingCTA.tsx`

### Props Interface
```typescript
interface WhatsAppFloatingCTAProps {
  agent: {
    name: string;
    phone: string;
    photo?: string;
    verificationTier?: 'verified' | 'pro' | 'elite';
    avgResponseTime?: number; // minutes
  };
  listing: {
    id: string;
    displayTitle: string;
    address: string;
    price: number;
    currency?: 'USD' | 'DOP';
  };
  className?: string;
}
```

### Message Template Logic

```typescript
function generateWhatsAppMessage(listing: any, agentName: string): string {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const message = `Hola ${agentName}, me interesa esta propiedad en VIVENTA:

📍 ${listing.displayTitle}
${listing.address}

💰 Precio: ${formatPrice(listing.price, listing.currency || 'USD')}

🔗 https://viventa.com.do/listing/${listing.id}

¿Está disponible para una visita?`;

  return encodeURIComponent(message);
}
```

### UI Design

**Mobile** (Floating Button):
```
              ┌────┐
              │ 💬 │  <- Floating circular button
              └────┘     Bottom-right (20px margins)
                         Green (#25D366 - WhatsApp brand)
                         Pulse animation on load
                         60px diameter
                         Shadow-2xl
```

**Desktop** (Sticky Sidebar Card):
```
┌──────────────────────────┐
│   [Agent Photo]          │
│   Juan Pérez             │
│   🟢 Verificado          │
│   Responde en <2h        │
│                          │
│   [💬 WhatsApp]          │
│   [📞 Llamar]            │
│   [✉️ Email]             │
│                          │
│   Horario: 9am - 6pm     │
└──────────────────────────┘
  Sticky (top: 6rem)
  300px width
  Right sidebar
```

### Code Implementation

```typescript
// components/WhatsAppFloatingCTA.tsx
'use client';

import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiPhone, FiMail, FiX } from 'react-icons/fi';
import Image from 'next/image';

interface WhatsAppFloatingCTAProps {
  agent: {
    name: string;
    phone: string;
    photo?: string;
    verificationTier?: 'verified' | 'pro' | 'elite';
    avgResponseTime?: number;
  };
  listing: {
    id: string;
    displayTitle: string;
    address: string;
    price: number;
    currency?: 'USD' | 'DOP';
  };
  className?: string;
}

export default function WhatsAppFloatingCTA({ 
  agent, 
  listing, 
  className = '' 
}: WhatsAppFloatingCTAProps) {
  const [showCard, setShowCard] = useState(false);
  
  const message = generateWhatsAppMessage(listing, agent.name);
  const whatsappUrl = `https://wa.me/${agent.phone.replace(/\D/g, '')}?text=${message}`;
  
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Mobile floating button
  const MobileButton = () => (
    <div className={`lg:hidden fixed bottom-20 right-4 z-50 ${className}`}>
      {!showCard ? (
        <button
          onClick={() => setShowCard(true)}
          className="w-16 h-16 bg-[#25D366] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform animate-pulse"
          aria-label="Contactar por WhatsApp"
        >
          <FaWhatsapp className="text-white text-3xl" />
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl p-4 w-72 animate-slide-up">
          <button
            onClick={() => setShowCard(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <FiX />
          </button>
          
          <div className="text-center mb-4">
            {agent.photo && (
              <Image
                src={agent.photo}
                alt={agent.name}
                width={60}
                height={60}
                className="rounded-full mx-auto mb-2"
              />
            )}
            <h4 className="font-bold text-[#0B2545]">{agent.name}</h4>
            {agent.verificationTier && (
              <span className="text-xs text-green-600">✓ Verificado</span>
            )}
            {agent.avgResponseTime && agent.avgResponseTime < 120 && (
              <p className="text-xs text-gray-600 mt-1">
                Responde en menos de 2 horas
              </p>
            )}
          </div>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#20BA5A] transition text-center mb-2 flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="text-xl" />
            Enviar WhatsApp
          </a>
          
          <a
            href={`tel:${agent.phone}`}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center flex items-center justify-center gap-2"
          >
            <FiPhone />
            Llamar
          </a>
        </div>
      )}
    </div>
  );
  
  // Desktop sticky sidebar
  const DesktopSidebar = () => (
    <div className={`hidden lg:block sticky top-24 ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-4">
          {agent.photo && (
            <Image
              src={agent.photo}
              alt={agent.name}
              width={80}
              height={80}
              className="rounded-full mx-auto mb-3 border-2 border-[#00A6A6]"
            />
          )}
          <h4 className="font-bold text-lg text-[#0B2545]">{agent.name}</h4>
          {agent.verificationTier && (
            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full mt-1">
              ✓ Agente Verificado
            </span>
          )}
          {agent.avgResponseTime && agent.avgResponseTime < 120 && (
            <p className="text-sm text-gray-600 mt-2">
              🟢 Responde en menos de 2 horas
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-gradient-to-r from-[#25D366] to-[#20BA5A] text-white rounded-lg font-medium hover:shadow-lg transition text-center flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="text-xl" />
            Contactar por WhatsApp
          </a>
          
          <a
            href={`tel:${agent.phone}`}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center flex items-center justify-center gap-2"
          >
            <FiPhone />
            Llamar ahora
          </a>
          
          <button
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center flex items-center justify-center gap-2"
          >
            <FiMail />
            Enviar email
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            📍 {listing.address}
          </p>
          <p className="text-sm font-semibold text-[#0B2545] mt-1">
            {formatPrice(listing.price, listing.currency || 'USD')}
          </p>
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      <MobileButton />
      <DesktopSidebar />
    </>
  );
}

function generateWhatsAppMessage(listing: any, agentName: string): string {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const message = `Hola ${agentName}, me interesa esta propiedad en VIVENTA:

📍 ${listing.displayTitle}
${listing.address}

💰 Precio: ${formatPrice(listing.price, listing.currency || 'USD')}

🔗 https://viventa.com.do/listing/${listing.id}

¿Está disponible para una visita?`;

  return encodeURIComponent(message);
}
```

---

## 🔗 Integration into Listing Page

### File to Modify
`app/listing/[id]/page.tsx`

### Changes Required

1. **Import new components**
2. **Add investment panel above description**
3. **Add mortgage calculator in collapsible section**
4. **Add WhatsApp CTA (mobile + desktop)**
5. **Reorder sections for conversion optimization**

### Updated Layout Structure

```typescript
export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await getListingById(params.id);
  const agent = await getAgentById(listing.agentId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Image Gallery */}
      <ImageGalleryCarousel images={listing.images} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Header */}
            <PropertyHeader listing={listing} />
            
            {/* 🆕 Investment Insight Panel */}
            <InvestmentInsightPanel listing={listing} />
            
            {/* Quick Facts */}
            <QuickFacts listing={listing} />
            
            {/* Description */}
            <Description listing={listing} />
            
            {/* 🆕 Mortgage Calculator */}
            <MortgageCalculator 
              defaultPrice={listing.price} 
              currency={listing.currency}
            />
            
            {/* Features & Amenities */}
            <FeaturesAmenities listing={listing} />
            
            {/* Verification Status */}
            <VerificationStatusSection listing={listing} agent={agent} />
            
            {/* Map */}
            <PropertyMap coordinates={listing.coordinates} />
            
            {/* Similar Properties */}
            <SimilarProperties listing={listing} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Desktop WhatsApp CTA stays fixed on scroll */}
            <WhatsAppFloatingCTA 
              agent={agent}
              listing={listing}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
```

---

## 📊 Success Metrics & Tracking

### Analytics Events to Track

```typescript
// When component mounts
trackEvent('investment_panel_view', listingId);

// When calculator is expanded
trackEvent('mortgage_calculator_open', listingId);

// When calculator values are adjusted
trackEvent('mortgage_calculator_interaction', listingId, {
  downPayment: value,
  interestRate: value,
  term: value
});

// When WhatsApp CTA is clicked
trackEvent('whatsapp_cta_click', listingId, {
  device: 'mobile' | 'desktop',
  source: 'floating_button' | 'sidebar'
});
```

### Key Performance Indicators

| Metric | Measurement | Target |
|--------|-------------|--------|
| Investment Panel View Rate | % of listing views | 100% (above fold) |
| Calculator Interaction Rate | % who open calculator | 40%+ |
| Calculator Engagement | Avg adjustments per session | 3+ |
| WhatsApp CTR (Mobile) | Clicks / listing views | 10%+ |
| WhatsApp CTR (Desktop) | Clicks / listing views | 6%+ |
| Time on Page | Avg duration | 2:30+ |
| Bounce Rate | % who leave immediately | <35% |

### A/B Testing Opportunities

1. **Investment Panel Position**
   - Test: Above vs below description
   - Hypothesis: Above = higher visibility = more engagement

2. **Calculator Default State**
   - Test: Collapsed vs expanded by default
   - Hypothesis: Collapsed with CTA = cleaner, same engagement

3. **WhatsApp CTA Copy**
   - Test: "Contactar" vs "WhatsApp" vs "Consultar"
   - Hypothesis: "WhatsApp" = clearer action

4. **Airbnb Badge Display**
   - Test: In investment panel vs separate badge
   - Hypothesis: In panel = more contextual

---

## 🚀 Implementation Timeline

### Day 1 (Mon Feb 24)
- ✅ Create InvestmentInsightPanel component
- ✅ Implement calculation logic
- ✅ Design responsive layout
- ✅ Add to listing page
- ✅ Test desktop + mobile

### Day 2 (Tue Feb 25)
- ⏳ Create MortgageCalculator component
- ⏳ Build slider inputs
- ⏳ Real-time calculation updates
- ⏳ Amortization table
- ⏳ Mobile optimization

### Day 3 (Wed Feb 26)
- ⏳ Create WhatsAppFloatingCTA component
- ⏳ Implement mobile floating button
- ⏳ Build desktop sticky sidebar
- ⏳ Message pre-fill logic
- ⏳ Full integration testing

---

## ⚠️ Technical Considerations

### Performance
- Memoize mortgage calculations (`useMemo`)
- Debounce slider inputs (300ms)
- Lazy load calculator (render on scroll)
- Optimize image sizes (agent photos)

### Mobile Optimization
- Touch-friendly slider sizes (min 44px targets)
- Prevent keyboard from obscuring inputs
- Test floating button doesn't block content
- Sticky sidebar disabled on mobile

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation for calculator
- Screen reader-friendly number formatting
- Focus management on modal open/close

### Error Handling
- Validate all numeric inputs (prevent negative, NaN)
- Graceful fallbacks if agent data missing
- Toast notification if WhatsApp fails to open
- Console errors logged for debugging

---

## 📝 Testing Checklist

- [ ] Investment panel displays correctly on all screen sizes
- [ ] Calculations are accurate (verify with manual math)
- [ ] Currency formatting matches locale
- [ ] Airbnb badge only shows for tourist zones
- [ ] Calculator sliders are smooth and responsive
- [ ] Amortization table displays correctly
- [ ] WhatsApp message pre-fills correctly
- [ ] Phone number formats correctly (international)
- [ ] Floating button doesn't block important content
- [ ] Desktop sidebar stays sticky during scroll
- [ ] All components work with missing optional data
- [ ] TypeScript compilation successful
- [ ] No console errors/warnings
- [ ] Lighthouse performance score >85

---

**This module transforms listing pages from static displays into interactive investment tools.**

**Market positioning upgrade: Marketplace → Investment Platform.**
