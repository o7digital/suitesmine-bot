"use client";

const fieldMap = {
  fr: [
    { key: "checkIn", label: "Arrivee", type: "date", placeholder: "" },
    { key: "checkOut", label: "Depart", type: "date", placeholder: "" },
    { key: "guests", label: "Voyageurs", type: "number", placeholder: "2" },
    { key: "roomType", label: "Chambre", type: "text", placeholder: "Suite" },
  ],
  es: [
    { key: "checkIn", label: "Llegada", type: "date", placeholder: "" },
    { key: "checkOut", label: "Salida", type: "date", placeholder: "" },
    { key: "guests", label: "Huespedes", type: "number", placeholder: "2" },
    { key: "roomType", label: "Categoria", type: "text", placeholder: "Suite" },
  ],
  en: [
    { key: "checkIn", label: "Check in", type: "date", placeholder: "" },
    { key: "checkOut", label: "Check out", type: "date", placeholder: "" },
    { key: "guests", label: "Guests", type: "number", placeholder: "2" },
    { key: "roomType", label: "Category", type: "text", placeholder: "Suite" },
  ],
  zh: [
    { key: "checkIn", label: "入住", type: "date", placeholder: "" },
    { key: "checkOut", label: "退房", type: "date", placeholder: "" },
    { key: "guests", label: "客人", type: "number", placeholder: "2" },
    { key: "roomType", label: "房型", type: "text", placeholder: "Suite" },
  ],
};

const heading = {
  fr: "Details du sejour",
  es: "Detalles de la estancia",
  en: "Stay details",
  zh: "住宿信息",
};

export default function DynamicFields({ metadata, setMetadata, language = "fr" }) {
  const fields = fieldMap[language] || fieldMap.fr;

  return (
    <div className="rounded-xl border border-[#ded7c9] bg-[#f9f5ee] p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-[#786b55]">
        {heading[language] || heading.fr}
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
              className="h-10 rounded-lg border border-[#ded7c9] bg-white px-3 text-sm text-[#2b2b2b] outline-none ring-[#c8aa70] placeholder:text-[#9b907d] focus:ring-2"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
