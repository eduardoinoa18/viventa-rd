'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import { Project } from '@/types/project';
import { formatArea, formatCurrency, convertCurrency, type Currency } from '@/lib/currency';
import useCurrency from '@/hooks/useCurrency';

interface ProjectCard extends Project {
  hasPromotion?: boolean;
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

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const preferredCurrency = useCurrency();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/list?status=active&sortBy=views&sortOrder=desc&limit=6');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pre-venta':
        return 'Pre-venta';
      case 'en-construccion':
        return 'En construccion';
      case 'entrega-proxima':
        return 'Entrega proxima';
      case 'entregado':
        return 'Entregado';
      case 'agotado':
        return 'Agotado';
      default:
        return status;
    }
  };

  const renderProjectCard = (project: ProjectCard) => {
    const totalUnits = project.totalUnits || 0;
    const availableUnits = project.availableUnits || 0;
    const soldUnits = Math.max(totalUnits - availableUnits, 0);
    const soldPercent = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

    const startingPriceUsd = project.smallestUnitPrice?.usd || 0;
    const startingPriceDop = convertCurrency(startingPriceUsd, 'USD', 'DOP');
    const primaryCurrency: Currency = preferredCurrency;
    const secondaryCurrency: Currency = preferredCurrency === 'USD' ? 'DOP' : 'USD';
    const primaryPrice = primaryCurrency === 'USD' ? startingPriceUsd : startingPriceDop;
    const secondaryPrice = secondaryCurrency === 'USD' ? startingPriceUsd : startingPriceDop;
    const startingMeters = project.smallestUnitMeters || 0;

    return (
      <div
        key={project.id}
        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
      >
        <div className="relative h-52 bg-gray-200">
          {project.featuredImage ? (
            <img
              src={project.featuredImage}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-viventa-ocean to-viventa-turquoise" />
          )}

          {project.hasPromotion && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8C35] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
              OFERTA ACTIVA
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-viventa-navy">
            {getStatusLabel(project.constructionStatus)}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-viventa-navy line-clamp-2">
              {project.name}
            </h3>
            <p className="text-sm text-gray-600">
              {project.location.city} · {project.location.sector}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-viventa-sand/30 rounded-lg p-3">
              <p className="text-gray-600 text-xs">Desde</p>
              <p className="font-bold text-viventa-navy">
                {startingPriceUsd > 0 ? formatCurrency(primaryPrice, { currency: primaryCurrency, compact: true }) : 'Consultar'}
              </p>
              {startingPriceUsd > 0 && (
                <p className="text-[11px] text-gray-500">
                  {formatCurrency(secondaryPrice, { currency: secondaryCurrency, compact: true })}
                </p>
              )}
            </div>
            <div className="bg-viventa-sand/30 rounded-lg p-3">
              <p className="text-gray-600 text-xs">Desde</p>
              <p className="font-bold text-viventa-navy">
                {startingMeters > 0 ? formatArea(startingMeters) : 'Consultar'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Disponibilidad</span>
              <span>{soldPercent}% vendido</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-viventa-turquoise to-viventa-ocean ${getPercentWidthClass(soldPercent)}`}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{availableUnits} disponibles</span>
              <span>{soldUnits} vendidos</span>
            </div>
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-viventa-ocean to-viventa-turquoise text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Ver Proyecto
            <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-viventa-sand/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-viventa-ocean to-viventa-turquoise rounded-xl flex items-center justify-center">
                <FiTrendingUp className="text-white text-2xl" />
              </div>
              <h2 className="text-4xl font-bold text-viventa-navy">Proyectos Destacados</h2>
            </div>
            <p className="text-gray-600 text-lg ml-15">
              Desarrollos completos con inventario vivo y financiamiento visible
            </p>
          </div>

          <Link
            href="/search?mode=projects"
            className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-viventa-ocean to-viventa-turquoise text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Ver todos los proyectos
            <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(renderProjectCard)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTrendingUp className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay proyectos activos</h3>
            <p className="text-gray-600 mb-6">Vuelve pronto para ver nuevos desarrollos</p>
          </div>
        )}
      </div>
    </section>
  );
}
