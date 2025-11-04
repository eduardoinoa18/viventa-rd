// components/CreateProfessionalModal.tsx
'use client'
import { useState } from 'react'
import { FiX, FiUser, FiBriefcase, FiGlobe, FiAward, FiMapPin, FiPhone, FiMail } from 'react-icons/fi'

type ProfessionalFormData = {
  // Personal Info
  name: string
  email: string
  phone: string
  
  // Professional Info
  role: 'agent' | 'broker'
  licenseNumber: string
  yearsExperience: string
  specialties: string[]
  languages: string[]
  
  // Business Info
  company: string
  brokerage: string
  officeAddress: string
  website: string
  
  // Additional
  bio: string
  certifications: string
}

const SPECIALTIES_OPTIONS = [
  'Residential Sales',
  'Commercial Real Estate',
  'Luxury Properties',
  'Investment Properties',
  'Property Management',
  'New Construction',
  'Land Sales',
  'Vacation Rentals',
]

const LANGUAGES_OPTIONS = ['Spanish', 'English', 'French', 'Italian', 'Portuguese', 'German', 'Chinese']

type Props = {
  onClose: () => void
  onSubmit: (data: ProfessionalFormData) => Promise<void>
  initialRole?: 'agent' | 'broker'
}

export default function CreateProfessionalModal({ onClose, onSubmit, initialRole = 'agent' }: Props) {
  const [formData, setFormData] = useState<ProfessionalFormData>({
    name: '',
    email: '',
    phone: '',
    role: initialRole,
    licenseNumber: '',
    yearsExperience: '',
    specialties: [],
    languages: ['Spanish'],
    company: '',
    brokerage: '',
    officeAddress: '',
    website: '',
    bio: '',
    certifications: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const updateField = (field: keyof ProfessionalFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }))
  }

  const toggleLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    if (step === 1) {
      return formData.name && formData.email && formData.phone && formData.role
    }
    if (step === 2) {
      return formData.yearsExperience && formData.specialties.length > 0
    }
    return true
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0B2545] to-[#134074] text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create Professional Account</h2>
              <p className="text-white/80 text-sm mt-1">
                {formData.role === 'agent' ? 'Add a new agent' : 'Add a new broker'} to the platform
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <FiX className="text-2xl" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                    s === step
                      ? 'bg-white text-[#0B2545]'
                      : s < step
                      ? 'bg-[#00A676] text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      s < step ? 'bg-[#00A676]' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/70">
            <span>Personal Info</span>
            <span>Professional Details</span>
            <span>Business Info</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Step 1:</strong> Enter the professional's basic contact information
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="role"
                        value="agent"
                        checked={formData.role === 'agent'}
                        onChange={(e) => updateField('role', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Real Estate Agent</span>
                    </label>
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="role"
                        value="broker"
                        checked={formData.role === 'broker'}
                        onChange={(e) => updateField('role', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Broker</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline mr-2" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline mr-2" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="juan@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiPhone className="inline mr-2" />
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="809-555-0123"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Step 2:</strong> Professional credentials and expertise
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiAward className="inline mr-2" />
                    License Number <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    id="licenseNumber"
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => updateField('licenseNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="RE-12345 (if applicable)"
                  />
                </div>

                <div>
                  <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiBriefcase className="inline mr-2" />
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={(e) => updateField('yearsExperience', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="0-2">0-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-15">11-15 years</option>
                    <option value="16+">16+ years</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties <span className="text-red-500">*</span> (Select at least one)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPECIALTIES_OPTIONS.map((specialty) => (
                      <label
                        key={specialty}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.specialties.includes(specialty)
                            ? 'border-[#00A676] bg-[#00A676]/10'
                            : 'border-gray-300 hover:border-[#00A676]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(specialty)}
                          onChange={() => toggleSpecialty(specialty)}
                          className="text-[#00A676] focus:ring-[#00A676]"
                        />
                        <span className="text-sm">{specialty}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiGlobe className="inline mr-2" />
                    Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES_OPTIONS.map((language) => (
                      <label
                        key={language}
                        className={`px-4 py-2 border rounded-full cursor-pointer transition-all ${
                          formData.languages.includes(language)
                            ? 'border-[#00A676] bg-[#00A676] text-white'
                            : 'border-gray-300 hover:border-[#00A676]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(language)}
                          onChange={() => toggleLanguage(language)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications (Optional)
                  </label>
                  <textarea
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => updateField('certifications', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    rows={2}
                    placeholder="e.g., ABR, GRI, CRS..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Info */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Step 3:</strong> Business information and profile
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiBriefcase className="inline mr-2" />
                    Company/Brokerage Name
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="ABC Realty"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiGlobe className="inline mr-2" />
                    Website (Optional)
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="officeAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="inline mr-2" />
                    Office Address
                  </label>
                  <input
                    id="officeAddress"
                    type="text"
                    value={formData.officeAddress}
                    onChange={(e) => updateField('officeAddress', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="123 Calle Principal, Santo Domingo"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    rows={4}
                    placeholder="Tell us about your experience, achievements, and what makes you stand out..."
                  />
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-6">
                <p className="text-sm text-green-800">
                  ✅ <strong>Ready to submit!</strong> The professional will receive an email with their login
                  credentials and password setup link.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-[#00A676] to-[#00C896] text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <FiUser />
                      Create Professional
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
