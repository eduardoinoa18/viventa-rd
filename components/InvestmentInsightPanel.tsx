// components/InvestmentInsightPanel.tsx
'use client';

import { FiDollarSign, FiCalendar, FiTrendingUp, FiInfo } from 'react-icons/fi';

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
  
  // Price per sqm category
  const getPriceCategory = () => {
    if (pricePerSqM > 3000) return { label: 'Premium', color: 'text-purple-600' };
    if (pricePerSqM > 2000) return { label: 'Competitivo', color: 'text-blue-600' };
    return { label: 'Accesible', color: 'text-green-600' };
  };
  
  const priceCategory = getPriceCategory();
  
  return (
    <div className={`bg-gradient-to-br from-[#00A6A6] to-[#00C8C8] rounded-2xl shadow-lg p-6 md:p-8 my-8 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          📊 Análisis de Inversión
        </h3>
        <button 
          className="text-white/80 hover:text-white transition" 
          title="Estimaciones basadas en promedios del mercado"
          aria-label="Más información"
        >
          <FiInfo className="text-xl" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Price per m² */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
          <div className="flex items-center gap-2 mb-2">
            <FiDollarSign className="text-white text-xl" />
            <span className="text-white/90 text-sm font-medium">Precio por m²</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {formatCurrency(pricePerSqM)}/m²
          </div>
          <div className={`text-xs mt-1 font-semibold ${priceCategory.color.replace('text-', 'text-white/')}80`}>
            {priceCategory.label}
          </div>
        </div>
        
        {/* Monthly mortgage */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
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
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
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
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/30 hover:bg-white/25 transition">
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
  
  if (monthlyRate === 0) return principal / months;
  
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
    'Bávaro': 1.3,
    'Cabarete': 1.2,
  };
  
  // Find matching city (case-insensitive, partial match)
  let multiplier = 1.0;
  for (const [cityName, mult] of Object.entries(cityMultipliers)) {
    if (city.toLowerCase().includes(cityName.toLowerCase())) {
      multiplier = mult;
      break;
    }
  }
  
  // Base monthly rent: 0.6% of property price
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
    'Bávaro',
    'Sosúa',
    'Juan Dolio'
  ];
  
  const idealTypes = ['Apartamento', 'Villa', 'Casa', 'Penthouse', 'Condominio'];
  
  const cityLower = city.toLowerCase();
  const typeLower = propertyType.toLowerCase();
  
  const isTouristZone = touristCities.some(tc => 
    cityLower.includes(tc.toLowerCase())
  );
  
  const isIdealType = idealTypes.some(type => 
    typeLower.includes(type.toLowerCase())
  );
  
  const hasEnoughBedrooms = !bedrooms || bedrooms >= 1;
  
  return isTouristZone && isIdealType && hasEnoughBedrooms;
}
