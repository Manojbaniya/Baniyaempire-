import { Language } from "../types";
import { Globe, ShieldAlert, Award } from "lucide-react";

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  scrolled: boolean;
  onOpenChat: () => void;
}

export default function Header({ language, setLanguage, scrolled, onOpenChat }: HeaderProps) {
  return (
    <nav
      id="nav"
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center transition-all duration-300 ${
        scrolled
          ? "bg-[#080604]/95 backdrop-blur-md border-b border-[#D4A017]/20 shadow-lg"
          : "bg-transparent"
      }`}
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label="castle">🏰</span>
        <div className="font-serif text-lg md:text-xl font-black tracking-tight text-[#D4A017]">
          Baniya <span className="italic text-[#F5C842]">Empire</span>
        </div>
      </div>

      {/* Auxiliary Badges & Language Selector */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Active Support Badge */}
        <button
          onClick={onOpenChat}
          className="hidden md:flex items-center gap-2 bg-[#D4A017]/10 hover:bg-[#D4A017]/20 border border-[#D4A017]/20 px-3 py-1.5 rounded-full text-xs text-[#F5C842] font-semibold cursor-pointer transition-all duration-200"
        >
          <Award className="w-3.5 h-3.5 text-[#F5C842]" />
          <span>
            {language === "en" ? "AI BeniDash Active" : "AI बेनीडेश सक्रिय"}
          </span>
        </button>

        {/* Translation Pill */}
        <div className="flex bg-[#D4A017]/8 border border-[#D4A017]/25 rounded-full p-0.5 gap-0.5 shadow-inner">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
              language === "en"
                ? "bg-[#D4A017] text-[#080604]"
                : "bg-transparent text-[#97896C] hover:text-[#F9F3E3]"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("np")}
            className={`px-3 py-1 rounded-full text-[11px] font-bold font-nepali transition-all duration-200 cursor-pointer ${
              language === "np"
                ? "bg-[#D4A017] text-[#080604]"
                : "bg-transparent text-[#97896C] hover:text-[#F9F3E3]"
            }`}
          >
            नेपाली
          </button>
        </div>
      </div>
    </nav>
  );
}
