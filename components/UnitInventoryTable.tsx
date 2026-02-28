'use client';

import { useState } from 'react';
import { Unit } from '@/types/project';

interface UnitInventoryTableProps {
  units: Unit[];
  onUnitSelect?: (unit: Unit) => void;
}

type SortField = 'unitNumber' | 'bedrooms' | 'meters' | 'priceUSD' | 'status';
type SortOrder = 'asc' | 'desc';

export default function UnitInventoryTable({ units, onUnitSelect }: UnitInventoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('unitNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBedrooms, setFilterBedrooms] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter units
  const filteredUnits = units.filter((unit) => {
    if (filterStatus && unit.status !== filterStatus) return false;
    if (filterBedrooms && unit.bedrooms !== parseInt(filterBedrooms)) return false;
    if (searchTerm && !unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Sort units
  const sortedUnits = [...filteredUnits].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'separado':
        return 'bg-blue-100 text-blue-800';
      case 'en-proceso':
        return 'bg-yellow-100 text-yellow-800';
      case 'vendido':
        return 'bg-gray-100 text-gray-800';
      case 'reservado':
        return 'bg-orange-100 text-orange-800';
      case 'bloqueado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const uniqueBedrooms = Array.from(new Set(units.map((u) => u.bedrooms))).sort();
  const uniqueStatuses = Array.from(new Set(units.map((u) => u.status)));

  return (
    <div className="w-full space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Unit Inventory</h3>
        <p className="text-sm text-gray-600 mb-4">
          {sortedUnits.length} of {units.length} units
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Unit number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="unit-filter-status">Status</label>
          <select
            id="unit-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="unit-filter-bedrooms">Bedrooms</label>
          <select
            id="unit-filter-bedrooms"
            value={filterBedrooms}
            onChange={(e) => setFilterBedrooms(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by bedrooms"
          >
            <option value="">All</option>
            {uniqueBedrooms.map((br) => (
              <option key={br} value={br.toString()}>
                {br} BR
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('');
              setFilterBedrooms('');
            }}
            className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('unitNumber')}
                  className="flex items-center hover:text-gray-900"
                >
                  Unit Number <SortIcon field="unitNumber" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('bedrooms')}
                  className="flex items-center hover:text-gray-900"
                >
                  BR/BA <SortIcon field="bedrooms" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('meters')}
                  className="flex items-center hover:text-gray-900"
                >
                  M² <SortIcon field="meters" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('priceUSD')}
                  className="flex items-center hover:text-gray-900"
                >
                  Price USD <SortIcon field="priceUSD" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center hover:text-gray-900"
                >
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Price/M²
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedUnits.length > 0 ? (
              sortedUnits.map((unit) => (
                <tr
                  key={unit.id}
                  onClick={() => onUnitSelect?.(unit)}
                  className={`hover:bg-gray-50 ${onUnitSelect ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{unit.unitNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{unit.unitType}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {unit.bedrooms}/{unit.bathrooms}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{unit.meters}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${unit.priceUSD.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(unit.status)}`}
                    >
                      {unit.status.charAt(0).toUpperCase() + unit.status.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ${Math.round(unit.pricePerM2).toLocaleString()}/m²
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No units match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      {sortedUnits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 bg-gray-50 p-6 rounded-lg">
          <div>
            <p className="text-gray-600 text-sm">Average Price</p>
            <p className="text-xl font-bold text-gray-900">
              ${Math.round(sortedUnits.reduce((acc, u) => acc + u.priceUSD, 0) / sortedUnits.length).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Average Size</p>
            <p className="text-xl font-bold text-gray-900">
              {Math.round(sortedUnits.reduce((acc, u) => acc + u.meters, 0) / sortedUnits.length)} m²
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Available Units</p>
            <p className="text-xl font-bold text-green-600">
              {sortedUnits.filter((u) => u.status === 'disponible').length}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Sold Units</p>
            <p className="text-xl font-bold text-gray-900">
              {sortedUnits.filter((u) => u.status === 'vendido').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
