
export function StatsSection() {
  const stats = [
    {
      value: "2,500+",
      label: "Call Flows Created",
      description: "Active call flows built by our users"
    },
    {
      value: "50K+", 
      label: "Calls Processed",
      description: "Successfully routed through our platform"
    },
    {
      value: "150+",
      label: "Phone Numbers",
      description: "Active phone numbers connected to flows"
    },
    {
      value: "500+",
      label: "Teams",
      description: "Organizations building call flows together"
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by teams worldwide
          </h2>
          <p className="text-lg text-gray-600">
            Join thousands of businesses using our visual call flow builder to create better customer experiences.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-gray-500">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
