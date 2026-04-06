"use client";

const fieldMap = {
  hotel: [
    { key: "checkIn", label: "Check-in", type: "date", placeholder: "" },
    { key: "checkOut", label: "Check-out", type: "date", placeholder: "" },
    { key: "guests", label: "Voyageurs", type: "number", placeholder: "2" },
  ],
  real_estate: [
    { key: "zone", label: "Zone", type: "text", placeholder: "Polanco" },
    {
      key: "budget",
      label: "Budget",
      type: "text",
      placeholder: "5,000,000 MXN",
    },
    {
      key: "propertyType",
      label: "Type",
      type: "text",
      placeholder: "Departamento",
    },
  ],
  default: [
    { key: "requestType", label: "Type de demande", type: "text", placeholder: "Support" },
    { key: "preferredDate", label: "Date souhaitée", type: "date", placeholder: "" },
  ],
};

export default function DynamicFields({ businessType, metadata, setMetadata }) {
  const fields = fieldMap[businessType] ?? fieldMap.default;

  return (
    <div className="rounded-2xl border border-[#e5e9f7] bg-[#f8faff] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        Metadata
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-xs text-black/60">{field.label}</span>
            <input
              type={field.type}
              value={metadata[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(e) =>
                setMetadata((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-[#8DA2FB] placeholder:text-black/30 focus:ring-2"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
