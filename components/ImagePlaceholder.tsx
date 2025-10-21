// Modern Caribbean-style SVG placeholder for property images
export default function ImagePlaceholder({ className = "" }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-200 via-teal-200 to-yellow-100 rounded-xl ${className}`} style={{height:'100%',width:'100%'}}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="16" width="48" height="32" rx="8" fill="#1E3A8A"/>
        <circle cx="24" cy="32" r="8" fill="#FFD166"/>
        <rect x="36" y="28" width="16" height="12" rx="4" fill="#00A6A6"/>
        <path d="M8 48L56 48" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  )
}