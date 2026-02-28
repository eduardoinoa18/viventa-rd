'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProjectDetail } from '@/types/project';
import { convertCurrency, formatCurrency, type Currency } from '@/lib/currency';
import useCurrency from '@/hooks/useCurrency';
import UnitInventoryTable from '@/components/UnitInventoryTable';

interface ProjectListingPageProps {
  projectId: string;
}

function getPercentWidthClass(percent: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
  const map: Record<number, string> = {
    0: 'w-0',
    5: 'w-[5%]',
    10: 'w-[10%]',
    15: 'w-[15%]',
    20: 'w-[20%]',
    25: 'w-[25%]',
    30: 'w-[30%]',
    35: 'w-[35%]',
    40: 'w-[40%]',
    45: 'w-[45%]',
    50: 'w-[50%]',
    55: 'w-[55%]',
    60: 'w-[60%]',
    65: 'w-[65%]',
    70: 'w-[70%]',
    75: 'w-[75%]',
    80: 'w-[80%]',
    85: 'w-[85%]',
    90: 'w-[90%]',
    95: 'w-[95%]',
    100: 'w-full',
  };
  return map[clamped] || 'w-0';
}

export default function ProjectListingPage({ projectId }: ProjectListingPageProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'amenities' | 'financing'>('overview');
  const preferredCurrency = useCurrency();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getConstructionBadgeColor = (status: string) => {
    switch (status) {
      case 'pre-venta':
        return 'bg-blue-100 text-blue-800';
      case 'en-construccion':
        return 'bg-yellow-100 text-yellow-800';
      case 'entrega-proxima':
        return 'bg-orange-100 text-orange-800';
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'agotado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const parseDate = (value: any) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const activeOffer = project.promotionalOffers?.find((offer) => {
    if (offer.active === false) return false;
    const validFrom = parseDate(offer.validFrom);
    const validUntil = parseDate(offer.validUntil);
    const now = Date.now();
    const inWindow =
      (!validFrom || validFrom.getTime() <= now) &&
      (!validUntil || validUntil.getTime() >= now);
    return inWindow;
  });

  const startingPriceUsd = project.smallestUnitPrice?.usd || 0;
  const startingPriceDop = convertCurrency(startingPriceUsd, 'USD', 'DOP');
  const primaryCurrency: Currency = preferredCurrency;
  const secondaryCurrency: Currency = preferredCurrency === 'USD' ? 'DOP' : 'USD';
  const primaryPrice = primaryCurrency === 'USD' ? startingPriceUsd : startingPriceDop;
  const secondaryPrice = secondaryCurrency === 'USD' ? startingPriceUsd : startingPriceDop;
  const offerPercent = activeOffer?.discountPercent || 0;
  const offerAmountUsd = activeOffer?.discountAmount?.usd || 0;
  const offerDiscountUsd = offerPercent > 0
    ? Math.round(startingPriceUsd * (offerPercent / 100))
    : offerAmountUsd;
  const discountedPriceUsd = Math.max(startingPriceUsd - offerDiscountUsd, 0);
  const discountedPriceDop = convertCurrency(discountedPriceUsd, 'USD', 'DOP');
  const hasOfferPrice = startingPriceUsd > 0 && offerDiscountUsd > 0;

  const inventorySummary = project.units.reduce(
    (acc, unit) => {
      acc.total += 1;
      if (unit.status === 'disponible') acc.disponible += 1;
      if (unit.status === 'separado') acc.separado += 1;
      if (unit.status === 'vendido') acc.vendido += 1;
      return acc;
    },
    { total: 0, disponible: 0, separado: 0, vendido: 0 }
  );

  const inventoryTotal = inventorySummary.total || project.totalUnits || 0;
  const soldPercent = inventoryTotal > 0
    ? Math.round((inventorySummary.vendido / inventoryTotal) * 100)
    : 0;
  const availablePercent = inventoryTotal > 0
    ? Math.round((inventorySummary.disponible / inventoryTotal) * 100)
    : 0;
  const separatedPercent = inventoryTotal > 0
    ? Math.round((inventorySummary.separado / inventoryTotal) * 100)
    : 0;

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 w-full bg-gray-200 overflow-hidden">
        {project.featuredImage ? (
          <Image
            src={project.featuredImage}
            alt={project.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-400 to-blue-600">
            <p className="text-white text-lg">No image available</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{project.name}</h1>
          <p className="text-white/90 text-lg">{project.shortDescription}</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 flex-wrap mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(project.status)}`}>
            {project.status.toUpperCase()}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConstructionBadgeColor(project.constructionStatus)}`}>
            {project.constructionStatus.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Key Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-gray-600 text-sm">Total Units</p>
            <p className="text-3xl font-bold text-gray-900">{project.totalUnits}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-gray-600 text-sm">Available</p>
            <p className="text-3xl font-bold text-green-600">{project.availableUnits}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-gray-600 text-sm">Starting From</p>
            {hasOfferPrice ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-500 line-through">
                  {formatCurrency(primaryPrice, { currency: primaryCurrency })}
                </p>
                <p className="text-2xl font-bold text-[#FF6B35]">
                  {formatCurrency(primaryCurrency === 'USD' ? discountedPriceUsd : discountedPriceDop, { currency: primaryCurrency })}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(secondaryCurrency === 'USD' ? discountedPriceUsd : discountedPriceDop, { currency: secondaryCurrency })}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(primaryPrice, { currency: primaryCurrency, compact: true })}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(secondaryPrice, { currency: secondaryCurrency, compact: true })}
                </p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-gray-600 text-sm">Views</p>
            <p className="text-3xl font-bold text-blue-600">{project.stats?.viewsLastWeek || 0}</p>
          </div>
        </div>
      </div>

      {/* Financing + Promotional Highlight */}
      {(activeOffer || (project.financingOptions && project.financingOptions.length > 0)) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeOffer && (
              <div className="bg-gradient-to-br from-[#FF6B35]/10 to-white border border-[#FF6B35]/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#FF6B35] font-semibold">Oferta especial</p>
                    <h3 className="text-2xl font-bold text-gray-900">{activeOffer.title}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6B35] text-white">
                    Promo activa
                  </span>
                </div>
                <p className="text-gray-700 mb-4">{activeOffer.description}</p>
                {hasOfferPrice && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(primaryPrice, { currency: primaryCurrency })}
                    </span>
                    <span className="text-2xl font-bold text-[#FF6B35]">
                      {formatCurrency(primaryCurrency === 'USD' ? discountedPriceUsd : discountedPriceDop, { currency: primaryCurrency })}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      Ahorra {formatCurrency(primaryCurrency === 'USD' ? offerDiscountUsd : convertCurrency(offerDiscountUsd, 'USD', 'DOP'), { currency: primaryCurrency })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {project.financingOptions && project.financingOptions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-viventa-ocean font-semibold">Financiamiento</p>
                    <h3 className="text-2xl font-bold text-gray-900">Opciones principales</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-viventa-ocean text-white">
                    Flexible
                  </span>
                </div>
                <div className="space-y-3">
                  {project.financingOptions
                    .filter((option) => option.active !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .slice(0, 3)
                    .map((option) => (
                      <div key={option.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{option.label}</p>
                          <p className="text-xs text-gray-600">{option.description}</p>
                        </div>
                        <div className="text-right">
                          {option.percent && (
                            <p className="text-sm font-semibold text-gray-900">{option.percent}%</p>
                          )}
                          {option.months && (
                            <p className="text-xs text-gray-500">{option.months} meses</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Transparency Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Disponibilidad</h2>
            <span className="text-sm font-semibold text-gray-700">
              {soldPercent}% vendido
            </span>
          </div>

          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className={`bg-green-500 ${getPercentWidthClass(availablePercent)}`}
              ></div>
              <div
                className={`bg-blue-500 ${getPercentWidthClass(separatedPercent)}`}
              ></div>
              <div
                className={`bg-gray-700 ${getPercentWidthClass(soldPercent)}`}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <span>{inventorySummary.disponible} disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <span>{inventorySummary.separado} separados</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-700"></span>
              <span>{inventorySummary.vendido} vendidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">City</p>
              <p className="text-gray-900 font-medium">{project.location.city}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Sector</p>
              <p className="text-gray-900 font-medium">{project.location.sector}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Address</p>
              <p className="text-gray-900 font-medium">{project.location.address}</p>
            </div>
          </div>
          {project.googleMapsUrl && (
            <a
              href={project.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              View on Google Maps →
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'units', label: `Units (${project.units.length})` },
            { id: 'amenities', label: 'Amenities' },
            { id: 'financing', label: 'Financing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">About This Project</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </div>

            {project.deliveryDate && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Delivery Date</h3>
                <p className="text-gray-700">
                  {new Date(project.deliveryDate).toLocaleDateString('es-DO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {project.stats && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-gray-600 text-sm">Units Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{project.stats.unitsSold || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Units Separated</p>
                  <p className="text-2xl font-bold text-gray-900">{project.stats.unitsSeparated || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Favorites</p>
                  <p className="text-2xl font-bold text-gray-900">{project.stats.favoritesCount || 0}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'units' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <UnitInventoryTable units={project.units} />
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            {project.amenities && project.amenities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-900">{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No amenities listed</p>
            )}
          </div>
        )}

        {activeTab === 'financing' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            {project.financingOptions && project.financingOptions.length > 0 ? (
              <div className="space-y-4">
                {project.financingOptions.map((option: any) => (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Type</p>
                        <p className="font-medium text-gray-900">{option.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Label</p>
                        <p className="font-medium text-gray-900">{option.label}</p>
                      </div>
                      {option.percent && (
                        <div>
                          <p className="text-gray-600 text-sm">Percentage</p>
                          <p className="font-medium text-gray-900">{option.percent}%</p>
                        </div>
                      )}
                      {option.months && (
                        <div>
                          <p className="text-gray-600 text-sm">Months</p>
                          <p className="font-medium text-gray-900">{option.months}</p>
                        </div>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-gray-600 text-sm mt-4">{option.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No financing options configured</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
