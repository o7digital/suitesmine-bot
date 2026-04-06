export default function MessageBubble({ role, children }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "border border-transparent bg-[#202431] text-white"
            : "border border-black/10 bg-white text-[#151826]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
