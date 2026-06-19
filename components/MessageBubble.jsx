export default function MessageBubble({ role, children }) {
  const isUser = role === "user";
  const parts =
    typeof children === "string"
      ? children.split(/(https?:\/\/[^\s]+)/g).filter(Boolean)
      : [children];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "border border-transparent bg-[#2b2b2b] text-white"
            : "border border-[#ded7c9] bg-[#fffdf8] text-[#2b2b2b]"
        }`}
      >
        {parts.map((part, index) =>
          typeof part === "string" && part.startsWith("http") ? (
            <a
              key={`${part}-${index}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-semibold underline"
            >
              {part}
            </a>
          ) : (
            part
          )
        )}
      </div>
    </div>
  );
}
