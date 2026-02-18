// Stage 1: Create page (Modal-driven workflow coming in Stage 2)
// Currently uses iframe from list page
// TODO Stage 2: Convert to native modal with form decomposition

export default function CreateListingPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            🚧 Stage 1: Temporary Redirect
          </h3>
          <p className="text-yellow-800 mb-4">
            Create functionality currently accessed via modal in list page.
          </p>
          <p className="text-sm text-yellow-700">
            Stage 2 will convert 818-line create form into native modal components.
          </p>
          <div className="mt-4">
            <a
              href="/master/listings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#E55A2B] font-semibold"
            >
              ← Back to Listings
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
