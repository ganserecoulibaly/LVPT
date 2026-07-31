import React from 'react'

export default function BillingToggle({
  value = 'monthly',
  onChange,
}) {
  const isMonthly = value === 'monthly'

  return (
    <div className="flex justify-center mb-10">
      <div className="relative inline-flex rounded-full bg-[#F4F2EF] p-1 shadow-sm">

        {/* Curseur animé */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white shadow transition-all duration-300 ${
            isMonthly ? 'left-1' : 'left-[calc(50%+2px)]'
          }`}
        />

        <button
          type="button"
          onClick={() => onChange?.('monthly')}
          className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            isMonthly
              ? 'text-navy'
              : 'text-navy/50 hover:text-navy'
          }`}
        >
          Mensuel
        </button>

        <button
          type="button"
          onClick={() => onChange?.('yearly')}
          className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            !isMonthly
              ? 'text-navy'
              : 'text-navy/50 hover:text-navy'
          }`}
        >
          <span>Annuel</span>

          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
            -17%
          </span>
        </button>

      </div>
    </div>
  )
}
