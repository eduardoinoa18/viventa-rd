'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProjectDetail } from '@/types/project';
import UnitInventoryTable from '@/components/UnitInventoryTable';

interface ProjectListingPageProps {
  projectId: string;
}

export default function ProjectListingPage({ projectId }: ProjectListingPageProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'amenities' | 'financing'>('overview');

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
            <p className="text-3xl font-bold text-gray-900">
              ${((project.smallestUnitPrice?.usd || 0) / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-gray-600 text-sm">Views</p>
            <p className="text-3xl font-bold text-blue-600">{project.stats?.viewsLastWeek || 0}</p>
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
