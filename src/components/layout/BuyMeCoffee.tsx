"use client";

export function BuyMeCoffee() {
  return (
    <a
      href="https://www.buymeacoffee.com/kelownaintelhub"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg transition-transform hover:scale-105 active:scale-95"
      style={{
        backgroundColor: "#FFDD00",
        color: "#000000",
        fontFamily: "'Cookie', cursive",
        fontSize: "1.125rem",
        border: "1px solid #000000",
      }}
    >
      <img
        src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
        alt=""
        className="h-5 w-5"
      />
      <span>Buy me a coffee</span>
    </a>
  );
}
