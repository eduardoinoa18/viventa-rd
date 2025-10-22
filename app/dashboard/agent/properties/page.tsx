"use client";
import React, { useState, useEffect } from "react";
import { getSession } from "@/lib/authSession";
import { uploadMultipleImages, validateImageFiles, generatePropertyImagePath } from "@/lib/storageService";

const statusOptions = ["All", "Active", "Pending", "Sold"];

export default function AgentPropertiesPage() {
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const session = getSession();
      if (!session) return;
      
      const res = await fetch(`/api/properties?agentId=${session.uid}`);
      const data = await res.json();
      setListings(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = status === "All" 
    ? listings 
    : listings.filter(l => l.status?.toLowerCase() === status.toLowerCase());

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">My Listings</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition">+ Add New Property</button>
      </div>
      <div className="flex gap-4 mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-3 py-2">
          {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
        </select>
        {/* Add more filters here (price, city) */}
      </div>
      <table className="w-full bg-white rounded-xl shadow overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Title</th>
            <th className="p-3">Status</th>
            <th className="p-3">Price</th>
            <th className="p-3">City</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="p-3 text-center text-gray-500">Loading...</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={5} className="p-3 text-center text-gray-500">No properties found</td></tr>
          ) : filtered.map(listing => (
            <tr key={listing.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{listing.title}</td>
              <td className="p-3">{listing.status}</td>
              <td className="p-3">${listing.price.toLocaleString()}</td>
              <td className="p-3">{listing.city}</td>
              <td className="p-3"><button className="text-blue-600 hover:underline">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && <AddPropertyForm onClose={() => { setShowForm(false); fetchProperties(); }} />}
    </main>
  );
}

function AddPropertyForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    propertyType: 'apartment',
    listingType: 'sale'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    // Enforce max 10 images total
    const combined = [...selectedFiles, ...files].slice(0, 10);
    const validation = validateImageFiles(combined);
    if (!validation.valid) {
      setUploadError(validation.errors[0]);
      return;
    }

    setUploadError('');
    setSelectedFiles(combined);
    const previews = combined.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  }

  function removeImage(index: number) {
    const nextFiles = [...selectedFiles];
    nextFiles.splice(index, 1);
    setSelectedFiles(nextFiles);
    const previews = nextFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
    setUploadProgress(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const session = getSession();
      if (!session) throw new Error('Not authenticated');

      // Validate images (optional but recommended)
      if (selectedFiles.length === 0) {
        setUploadError('Please upload at least one image.');
        setSubmitting(false);
        return;
      }

      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area),
        agentId: session.uid,
        agentName: session.name || '',
        status: 'active',
        images: []
      };

      // 1) Create property first to get an ID
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...propertyData })
      });

      if (!res.ok) throw new Error('Failed to create property');
      const created = await res.json();
      const propertyId = created.id as string;

      // 2) Upload images to Storage
      const folderPath = generatePropertyImagePath(session.uid, propertyId);
      const imageUrls = await uploadMultipleImages(selectedFiles, folderPath, (index, progress) => {
        setUploadProgress(prev => ({ ...prev, [index]: progress }));
      });

      // 3) Update property with image URLs
      const updateRes = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: propertyId, images: imageUrls })
      });
      if (!updateRes.ok) throw new Error('Failed to attach images to property');

      alert('Property created successfully!');
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 w-full max-w-lg shadow-lg relative max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">✕</button>
        <h3 className="text-lg font-bold mb-4">Upload New Property</h3>
        <div className="mb-3">
          <input 
            className="w-full border rounded px-3 py-2" 
            placeholder="Property Title" 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            required 
          />
        </div>
        <div className="mb-3">
          <input 
            className="w-full border rounded px-3 py-2" 
            placeholder="Address" 
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            required 
          />
        </div>
        <div className="mb-3 flex gap-2">
          <input 
            className="w-1/2 border rounded px-3 py-2" 
            placeholder="Price" 
            type="number" 
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
            required 
          />
          <select 
            className="w-1/2 border rounded px-3 py-2"
            value={formData.listingType}
            onChange={e => setFormData({...formData, listingType: e.target.value as any})}
          >
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
        <div className="mb-3 flex gap-2">
          <input 
            className="w-1/3 border rounded px-3 py-2" 
            placeholder="Bedrooms" 
            type="number" 
            value={formData.bedrooms}
            onChange={e => setFormData({...formData, bedrooms: e.target.value})}
            required 
          />
          <input 
            className="w-1/3 border rounded px-3 py-2" 
            placeholder="Bathrooms" 
            type="number" 
            value={formData.bathrooms}
            onChange={e => setFormData({...formData, bathrooms: e.target.value})}
            required 
          />
          <input 
            className="w-1/3 border rounded px-3 py-2" 
            placeholder="SqFt" 
            type="number" 
            value={formData.area}
            onChange={e => setFormData({...formData, area: e.target.value})}
            required 
          />
        </div>
        <div className="mb-3">
          <select 
            className="w-full border rounded px-3 py-2"
            value={formData.propertyType}
            onChange={e => setFormData({...formData, propertyType: e.target.value as any})}
          >
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div className="mb-3">
          <textarea 
            className="w-full border rounded px-3 py-2" 
            placeholder="Description" 
            rows={3} 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required 
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Images (Max 10)</label>
          <input 
            type="file" 
            multiple 
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="w-full text-sm border rounded px-3 py-2" 
          />
          {uploadError && (
            <p className="text-red-600 text-sm mt-1">{uploadError}</p>
          )}
          
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    ✕
                  </button>
                  {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1">
                      {Math.round(uploadProgress[index])}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition w-full disabled:opacity-50"
        >
          {submitting ? 'Uploading...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
