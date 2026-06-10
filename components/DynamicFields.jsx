"use client";

const copyByLanguage = {
  fr: {
    metadata: "Metadata",
    guests: "Voyageurs",
    roomType: "Type de chambre",
    roomPlaceholder: "Suite Deluxe",
  },
  es: {
    metadata: "Datos",
    guests: "Huespedes",
    roomType: "Tipo de habitacion",
    roomPlaceholder: "Suite Deluxe",
  },
  en: {
    metadata: "Metadata",
    guests: "Guests",
    roomType: "Room type",
    roomPlaceholder: "Deluxe Suite",
  },
};

export default function DynamicFields({ metadata, setMetadata }) {
  const copy = copyByLanguage[metadata.language] || copyByLanguage.fr;
  const fields = [
    { key: "checkIn", label: "Check-in", type: "date", placeholder: "" },
    { key: "checkOut", label: "Check-out", type: "date", placeholder: "" },
    { key: "guests", label: copy.guests, type: "number", placeholder: "2" },
    { key: "roomType", label: copy.roomType, type: "text", placeholder: copy.roomPlaceholder },
  ];

  return (
    <div className="rounded-2xl border border-[#e5e9f7] bg-[#f8faff] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        {copy.metadata}
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
