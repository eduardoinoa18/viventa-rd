// components/skeletons/MessageThreadSkeleton.tsx
export default function MessageThreadSkeleton() {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
          <div className={`max-w-[70%] rounded-lg p-3 ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <div className="h-3 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
