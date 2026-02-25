'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CreateProjectInput, UnitType } from '@/types/project';

type FormTab = 'info' | 'location' | 'units' | 'amenities' | 'financing' | 'review';

interface ProjectFormState {
  name: string;
  description: string;
  shortDescription: string;
  city: string;
  sector: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  constructionStatus: 'pre-venta' | 'en-construccion' | 'entrega-proxima' | 'entregado';
  deliveryDate: string; // Keep as string for input field
  totalUnits: number;
  amenities: string[];
  images: string[];
  unitsData: Array<{
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    meters: number;
    lotMeters?: number;
    unitType: UnitType;
    priceUSD: number;
  }>;
}

const AMENITIES_OPTIONS = [
  'Piscina',
  'Gimnasio',
  'Parque infantil',
  'Salón de eventos',
  'Seguridad 24/7',
  'Ascensor',
  'Estacionamiento',
  'Área verde',
  'Cancha deportiva',
  'Cafetería',
];

const FINANCING_TYPES = [
  { value: 'separacion', label: 'Separación' },
  { value: 'inicial', label: 'Inicial' },
  { value: 'contra-entrega', label: 'Contra Entrega' },
  { value: 'interno', label: 'Financiamiento Interno' },
  { value: 'bancario', label: 'Financiamiento Bancario' },
];

export default function ProjectCreationForm() {
  const [currentTab, setCurrentTab] = useState<FormTab>('info');
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<ProjectFormState>({
    name: '',
    description: '',
    shortDescription: '',
    city: '',
    sector: '',
    address: '',
    latitude: 18.4861,
    longitude: -69.9312,
    googleMapsUrl: '',
    constructionStatus: 'pre-venta',
    deliveryDate: '',
    totalUnits: 0,
    amenities: [],
    images: [],
    unitsData: [],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormState((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...(prev.amenities || []), amenity],
    }));
  };

  const handleAddUnit = () => {
    setFormState((prev) => ({
      ...prev,
      unitsData: [
        ...prev.unitsData,
        {
          unitNumber: `Unit-${prev.unitsData.length + 1}`,
          bedrooms: 2,
          bathrooms: 2,
          meters: 100,
          lotMeters: 150,
          unitType: 'apartamento',
          priceUSD: 150000,
        },
      ],
    }));
  };

  const handleUpdateUnit = (index: number, field: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      unitsData: prev.unitsData.map((unit, i) =>
        i === index ? { ...unit, [field]: value } : unit
      ),
    }));
  };

  const handleRemoveUnit = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      unitsData: prev.unitsData.filter((_, i) => i !== index),
    }));
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const units: Array<{
          unitNumber: string;
          bedrooms: number;
          bathrooms: number;
          meters: number;
          lotMeters?: number;
          unitType: UnitType;
          priceUSD: number;
        }> = [];

        // Skip header and parse CSV
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [unitNumber, bedrooms, bathrooms, meters, lotMeters, unitType, priceUSD] = line.split(',');
          units.push({
            unitNumber: unitNumber?.trim() || `Unit-${i}`,
            bedrooms: parseInt(bedrooms, 10) || 2,
            bathrooms: parseInt(bathrooms, 10) || 2,
            meters: parseInt(meters, 10) || 100,
            lotMeters: parseInt(lotMeters, 10) || 150,
            unitType: (unitType?.trim() as UnitType) || 'apartamento',
            priceUSD: parseInt(priceUSD, 10) || 150000,
          });
        }

        setFormState((prev) => ({ ...prev, unitsData: units }));
        toast.success(`${units.length} units loaded from CSV`);
      } catch (error) {
        toast.error('Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const validateTab = (): boolean => {
    switch (currentTab) {
      case 'info':
        if (!formState.name || !formState.description || !formState.city) {
          toast.error('Please fill all required fields');
          return false;
        }
        return true;
      case 'location':
        if (!formState.latitude || !formState.longitude) {
          toast.error('Please set location coordinates');
          return false;
        }
        return true;
      case 'units':
        if (formState.unitsData.length === 0) {
          toast.error('Please add at least one unit');
          return false;
        }
        return true;
      case 'financing':
      case 'amenities':
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create project
      const projectRes = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          description: formState.description,
          shortDescription: formState.shortDescription,
          city: formState.city,
          sector: formState.sector,
          address: formState.address,
          latitude: formState.latitude,
          longitude: formState.longitude,
          googleMapsUrl: formState.googleMapsUrl,
          constructionStatus: formState.constructionStatus,
          deliveryDate: formState.deliveryDate,
          totalUnits: formState.unitsData.length,
          amenities: formState.amenities,
          images: formState.images || [],
        }),
      });

      if (!projectRes.ok) {
        const error = await projectRes.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const projectData = await projectRes.json();
      const projectId = projectData.projectId;

      // Bulk create units
      if (formState.unitsData.length > 0) {
        const unitsRes = await fetch(`/api/projects/${projectId}/units`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            units: formState.unitsData.map((unit) => ({
              ...unit,
              priceDOP: unit.priceUSD * 58,
              initialPercent: 20,
            })),
          }),
        });

        if (!unitsRes.ok) {
          throw new Error('Failed to create units');
        }
      }

      toast.success('Project created successfully!');
      // Reset form or redirect
      setFormState({
        name: '',
        description: '',
        shortDescription: '',
        city: '',
        sector: '',
        address: '',
        latitude: 18.4861,
        longitude: -69.9312,
        googleMapsUrl: '',
        constructionStatus: 'pre-venta',
        deliveryDate: '',
        totalUnits: 0,
        amenities: [],
        images: [],
        unitsData: [],
      });
      setCurrentTab('info');
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const nextTab = () => {
    if (!validateTab()) return;
    const tabs: FormTab[] = ['info', 'location', 'units', 'amenities', 'financing', 'review'];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) setCurrentTab(tabs[currentIndex + 1]);
  };

  const prevTab = () => {
    const tabs: FormTab[] = ['info', 'location', 'units', 'amenities', 'financing', 'review'];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1]);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Project</h1>
          <p className="text-gray-600">Create and list your new real estate project in 6 easy steps</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'info', label: '1. Info' },
            { id: 'location', label: '2. Location' },
            { id: 'units', label: '3. Units' },
            { id: 'amenities', label: '4. Amenities' },
            { id: 'financing', label: '5. Financing' },
            { id: 'review', label: '6. Review' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as FormTab)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                currentTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          {/* Tab 1: Project Info */}
          {currentTab === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Project Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formState.name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Proyecto Costa Verde"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formState.description || ''}
                  onChange={handleInputChange}
                  placeholder="Detailed description of your project"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formState.shortDescription || ''}
                  onChange={handleInputChange}
                  placeholder="One-line summary"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formState.city || ''}
                    onChange={handleInputChange}
                    placeholder="Santo Domingo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sector
                  </label>
                  <input
                    type="text"
                    name="sector"
                    value={formState.sector || ''}
                    onChange={handleInputChange}
                    placeholder="Los Apóstoles"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formState.address || ''}
                    onChange={handleInputChange}
                    placeholder="Calle Principal 123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Construction Status *
                  </label>
                  <select
                    name="constructionStatus"
                    value={formState.constructionStatus || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pre-venta">Pre-venta</option>
                    <option value="en-construccion">En construcción</option>
                    <option value="entrega-proxima">Entrega próxima</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formState.deliveryDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Location */}
          {currentTab === 'location' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Location Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    step="0.0001"
                    value={formState.latitude || ''}
                    onChange={handleCoordinateChange}
                    placeholder="18.4861"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    step="0.0001"
                    value={formState.longitude || ''}
                    onChange={handleCoordinateChange}
                    placeholder="-69.9312"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps URL
                </label>
                <input
                  type="url"
                  name="googleMapsUrl"
                  value={formState.googleMapsUrl || ''}
                  onChange={handleInputChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  Current coordinates: {formState.latitude}, {formState.longitude}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Tip: Use Google Maps to find precise coordinates for better accuracy
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Units */}
          {currentTab === 'units' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Units</h2>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">Add units by:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Uploading a CSV file</li>
                  <li>Adding units one by one manually</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Choose CSV File
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Format: unitNumber, bedrooms, bathrooms, meters, lotMeters, unitType, priceUSD
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddUnit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Add Unit
                </button>
              </div>

              {/* Units List */}
              {formState.unitsData.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    {formState.unitsData.length} Units Added
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Unit #</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">BR/BA</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">M²</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Price USD</th>
                          <th className="px-4 py-2 text-center text-sm font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formState.unitsData.map((unit, idx) => (
                          <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">{unit.unitNumber}</td>
                            <td className="px-4 py-2 text-sm">{unit.unitType}</td>
                            <td className="px-4 py-2 text-sm">
                              {unit.bedrooms}/{unit.bathrooms}
                            </td>
                            <td className="px-4 py-2 text-sm">{unit.meters}</td>
                            <td className="px-4 py-2 text-sm font-medium">
                              ${unit.priceUSD.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleRemoveUnit(idx)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Amenities */}
          {currentTab === 'amenities' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Amenities & Features</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITIES_OPTIONS.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        checked={formState.amenities?.includes(amenity) || false}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Financing */}
          {currentTab === 'financing' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Financing Options</h2>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  Configure available financing options for your units. You can add more details later in the project dashboard.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Available Options</label>
                {FINANCING_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Review */}
          {currentTab === 'review' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-900 font-medium">Ready to publish?</p>
                <p className="text-sm text-green-800 mt-1">
                  Review the information below and click &quot;Publish Project&quot; to make it live.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Project Name</p>
                  <p className="text-gray-900">{formState.name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">City</p>
                  <p className="text-gray-900">{formState.city}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Status</p>
                  <p className="text-gray-900">{formState.constructionStatus}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Units</p>
                  <p className="text-gray-900">{formState.unitsData.length}</p>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-700 text-sm mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {formState.amenities?.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={prevTab}
            disabled={currentTab === 'info'}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {currentTab !== 'review' && (
            <button
              onClick={nextTab}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Next →
            </button>
          )}

          {currentTab === 'review' && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing...' : 'Publish Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
