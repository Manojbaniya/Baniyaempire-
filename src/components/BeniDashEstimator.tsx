import { useState, FormEvent } from "react";
import { Language, EstimatorResult } from "../types";
import { Navigation, Compass, CircleHelp, Info, ArrowRight, Sparkles, MapPin, Loader2 } from "lucide-react";

interface BeniDashEstimatorProps {
  language: Language;
}

export default function BeniDashEstimator({ language }: BeniDashEstimatorProps) {
  const [fromLoc, setFromLoc] = useState("Beni Bazaar");
  const [toLoc, setToLoc] = useState("Pula, Dandakhet");
  const [serviceType, setServiceType] = useState("ride");
  const [result, setResult] = useState<EstimatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locations = [
    "Beni Bazaar",
    "Galeshwor Dham",
    "Pula, Dandakhet",
    "Singa Tatopani",
    "Tatopani Hot Spring",
    "Babiyachaur",
    "Darwang"
  ];

  const handleEstimate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/estimator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromLoc,
          to: toLoc,
          serviceType
        })
      });

      if (!res.ok) {
        throw new Error(language === "en" ? "Server error estimating fare" : "किराया हिसाब गर्दा त्रुटि भयो");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const serviceLabels: Record<string, { en: string; np: string; icon: string }> = {
    ride: { en: "Ride Request 🛵", np: "सवारी यात्रा 🛵", icon: "🛵" },
    food: { en: "Food Delivery 🍔", np: "खाना डेलिभरी 🍔", icon: "🍔" },
    grocery: { en: "Grocery Bag 🛒", np: "किराना सामग्री 🛒", icon: "🛒" },
    medicine: { en: "Medicine Delivery 💊", np: "औषधि आपूर्ति 💊", icon: "💊" }
  };

  return (
    <div className="bg-[#100C08] rounded-2xl border border-[#D4A017]/15 p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Navigation className="w-5 h-5 text-[#D4A017]" />
          <h3 className="font-serif font-black text-white text-lg">
            {language === "en" ? "BeniDash Route & Fare Estimator" : "बेनीडेश रूट र भाडा नियामक"}
          </h3>
        </div>

        <p className="text-xs text-[#9A8A6A] mb-5 leading-relaxed">
          {language === "en"
            ? "Calculate instant transparent pricing for transport, grocery order, and medical services within the district."
            : "म्याग्दी जिल्ला भित्र यात्रा, किराना सामान वा औषधि ओसारपसार गर्न लाग्ने भाडाको पूर्व-अनुमान गर्नुहोस्।"}
        </p>

        <form onSubmit={handleEstimate} className="space-y-4">
          {/* Pickup Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#9A8A6A] font-bold uppercase mb-1 tracking-wider">
                {language === "en" ? "From (Pickup Point)" : "प्रस्थान बिन्दु"}
              </label>
              <select
                value={fromLoc}
                onChange={(e) => {
                  setFromLoc(e.target.value);
                  setResult(null);
                }}
                className="w-full bg-[#080604] border border-[#D4A017]/20 rounded-lg p-2.5 text-xs text-white"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#9A8A6A] font-bold uppercase mb-1 tracking-wider">
                {language === "en" ? "To (Destination)" : "गन्तव्य बिन्दु"}
              </label>
              <select
                value={toLoc}
                onChange={(e) => {
                  setToLoc(e.target.value);
                  setResult(null);
                }}
                className="w-full bg-[#080604] border border-[#D4A017]/20 rounded-lg p-2.5 text-xs text-white"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-[10px] text-[#9A8A6A] font-bold uppercase mb-1 tracking-wider">
              {language === "en" ? "Type of Service" : "सेवाको प्रकारझ"}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(serviceLabels).map(([key, labelObj]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setServiceType(key);
                    setResult(null);
                  }}
                  className={`p-2 rounded-lg border text-center transition-all duration-200 cursor-pointer text-[11px] ${
                    serviceType === key
                      ? "bg-[#D4A017]/15 border-[#D4A017] text-[#F5C842] font-bold"
                      : "bg-[#080604] border-[#D4A017]/10 text-[#9A8A6A]"
                  }`}
                >
                  <span className="block mt-0.5">{language === "en" ? labelObj.en : labelObj.np}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || fromLoc === toLoc}
            className="w-full bg-[#D4A017] hover:bg-[#F5C842] text-black font-bold p-3 rounded-lg text-xs hover:scale-[1.01] transition-all cursor-pointer text-center flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{language === "en" ? "Calculating Mountain Trajectory..." : "प्रगतिमा छ..."}</span>
              </>
            ) : (
              <span>{language === "en" ? "Calculate Route & Estimate Fare" : "भाडा दर विश्लेषण गर्नुहोस्"}</span>
            )}
          </button>
        </form>

        {fromLoc === toLoc && (
          <p className="text-[11px] text-orange-400 mt-2 text-center">
            {language === "en" ? "⚠ Pickup & Destination cannot be identical" : "⚠ प्रस्थान र गन्तव्य एउटै हुन सक्दैन"}
          </p>
        )}
      </div>

      <div className="mt-6">
        {result ? (
          <div className="bg-[#15100B] border border-[#D4A017]/25 rounded-xl p-4 relative overflow-hidden">
            <span className="absolute -right-8 -bottom-8 text-6xl opacity-5 pointer-events-none">🛵</span>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[9px] uppercase tracking-wider bg-[#D4A017]/10 text-[#F5C842] border border-[#D4A017]/20 px-2 py-0.5 rounded-full font-bold">
                  {language === "en" ? "Est. Summary" : "अनुमान रिपोर्ट"}
                </span>
                <p className="text-xs text-[#9A8A6A] mt-1 flex items-center gap-1">
                  <span>{result.from}</span>
                  <ArrowRight className="w-3 h-3 text-[#D4A017]" />
                  <span>{result.to}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  NPR {result.estimatedFeeNpr}
                </div>
                <span className="text-[9px] text-[#9A8A6A]">
                  {language === "en" ? "Target Total" : "जम्मा रकम"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#D4A017]/10 text-xs">
              <div>
                <span className="text-[#9A8A6A] block text-[10px] uppercase font-bold tracking-tight">Distance</span>
                <span className="text-white font-mono font-bold text-sm">
                  {result.distanceKm} km
                </span>
              </div>
              <div>
                <span className="text-[#9A8A6A] block text-[10px] uppercase font-bold tracking-tight">Time Est.</span>
                <span className="text-white font-bold text-sm">
                  ~{result.estimatedMinutes} {language === "en" ? "mins" : "मिनेट"}
                </span>
              </div>
            </div>

            <div className="mt-3 bg-[#080604] rounded-lg p-2 border border-[#D4A017]/5 text-[10px] text-[#9A8A6A] leading-relaxed flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#F5C842] flex-shrink-0" />
              <span>
                <strong>{language === "en" ? "Beni Formula" : "आधिकारिक सूत्र"}:</strong> {result.formula}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#080604] border border-[#D4A017]/5 border-dashed rounded-xl p-8 text-center text-xs text-[#9A8A6A] flex flex-col items-center justify-center gap-1">
            <Compass className="w-6 h-6 text-[#D4A017]/30 mb-1" />
            <span>
              {language === "en" ? "No route estimated yet" : "कुनै रूट विश्लेषण गरिएको छैन"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
