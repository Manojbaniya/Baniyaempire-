import { useState, useEffect, FormEvent } from "react";
import { Job, Language } from "../types";
import { Briefcase, MapPin, DollarSign, PlusCircle, Search, Filter, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BeniJobsSectionProps {
  language: Language;
}

export default function BeniJobsSection({ language }: BeniJobsSectionProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Job Post State
  const [showPostForm, setShowPostForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNpTitle, setNewNpTitle] = useState("");
  const [newCategory, setNewCategory] = useState("delivery");
  const [newType, setNewType] = useState("Full-time");
  const [newLoc, setNewLoc] = useState("Beni, Myagdi");
  const [newNpLoc, setNewNpLoc] = useState("बेनी, म्याग्दी");
  const [newSalary, setNewSalary] = useState("NPR 20,000 / month");
  const [newDesc, setNewDesc] = useState("");
  const [newNpDesc, setNewNpDesc] = useState("");
  
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Categories list
  const categories = [
    { value: "all", label: language === "en" ? "All Jobs" : "सबै जागिर" },
    { value: "delivery", label: language === "en" ? "Delivery & Ride" : "डेलिभरी र राइड" },
    { value: "agriculture", label: language === "en" ? "Farming & Agro" : "कृषि तथा खेती" },
    { value: "education", label: language === "en" ? "Education & IT" : "शिक्षा र आईटी" },
    { value: "transport", label: language === "en" ? "Transport" : "यातायात" }
  ];

  // Load jobs from server
  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter logic
  const filteredJobs = jobs.filter(j => {
    const matchesCat = selectedCategory === "all" || j.category === selectedCategory;
    const searchLow = searchQuery.toLowerCase();
    const titleMatch = (j.title || "").toLowerCase().includes(searchLow) || (j.npTitle || "").includes(searchQuery);
    const descMatch = (j.description || "").toLowerCase().includes(searchLow) || (j.npDescription || "").includes(searchQuery);
    const locMatch = (j.location || "").toLowerCase().includes(searchLow) || (j.npLocation || "").includes(searchQuery);
    return matchesCat && (titleMatch || descMatch || locMatch);
  });

  // Handle Form Post
  const handlePostJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setPosting(true);
    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          npTitle: newNpTitle || newTitle,
          category: newCategory,
          type: newType,
          location: newLoc,
          npLocation: newNpLoc || newLoc,
          salary: newSalary,
          description: newDesc,
          npDescription: newNpDesc || newDesc
        })
      });

      if (res.ok) {
        const postedJob = await res.json();
        setJobs(prev => [postedJob, ...prev]);
        setPostSuccess(true);
        
        // Reset form
        setNewTitle("");
        setNewNpTitle("");
        setNewDesc("");
        setNewNpDesc("");
        
        // Hide overlay/toast after 3 seconds
        setTimeout(() => {
          setPostSuccess(false);
          setShowPostForm(false);
        }, 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-[#100C08] p-6 rounded-2xl border border-[#D4A017]/15">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-serif font-black text-xl text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#D4A017]" />
            <span>{language === "en" ? "BeniJobs Nepal Board" : "बेनीजब्स नेपाल रोजगार मञ्च"}</span>
          </h3>
          <p className="text-xs text-[#9A8A6A] mt-1">
            {language === "en" 
              ? "Connecting local youth with opportunities in and around Myagdi." 
              : "स्थानीय युवा तथा कामदारहरूलाई म्याग्दी भित्र र आसपासमा जोडदै।"}
          </p>
        </div>
        
        <button
          onClick={() => setShowPostForm(prev => !prev)}
          className="flex items-center gap-2 bg-[#D4A017]/12 hover:bg-[#D4A017]/22 border border-[#D4A017]/30 hover:border-[#D4A017]/60 text-[#F5C842] px-4 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all duration-200 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showPostForm ? (language === "en" ? "Cancel Post" : " रद्द गर्नुहोस्") : (language === "en" ? "Post a Job (Free)" : "काम पोस्ट गर्नुस् (निःशुल्क)")}</span>
        </button>
      </div>

      {postSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2 mb-6"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{language === "en" ? "Job posted successfully! Refreshed board and notified candidates." : "काम सफलतापूर्वक पोस्ट भयो! जागिर खोज्नेहरू तुरुन्तै सूचित हुनेछन्।"}</span>
        </motion.div>
      )}

      {/* Post job form expander */}
      <AnimatePresence>
        {showPostForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-[#080604] border border-[#D4A017]/20 rounded-xl p-4 mb-6"
          >
            <h4 className="text-xs text-[#F5C842] font-extrabold uppercase mb-4 tracking-wider flex items-center gap-1.5">
              <span>✦</span>
              <span>{language === "en" ? "Post Opportunity details" : "नयाँ रोजगारीको विवरण थप्नुहोस्"}</span>
            </h4>
            
            <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Job Title (English)" : "जागिरको शीर्षक (English)"}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Cook / Organic Harvester"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Job Title (Nepali Transl.)" : "जागिरको शीर्षक (नेपालीमा)"}</label>
                <input
                  type="text"
                  placeholder="जस्तै: कुक / बरिष्ट कृषि सहायक"
                  value={newNpTitle}
                  onChange={(e) => setNewNpTitle(e.target.value)}
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Category" : "श्रेणी"}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="delivery">Delivery & Ride</option>
                  <option value="agriculture">Farming & Agro</option>
                  <option value="education">Education & IT</option>
                  <option value="transport">Transport / Logistics</option>
                  <option value="general">Hospitality / Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Job Type" : "प्रकार"}</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract / Casual</option>
                  <option value="Seasonal">Seasonal Assistant</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Location (English)" : "स्थान (English)"}</label>
                <input
                  type="text"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Location (Nepali)" : "स्थान (नेपालीमा)"}</label>
                <input
                  type="text"
                  value={newNpLoc}
                  onChange={(e) => setNewNpLoc(e.target.value)}
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Salary / Remuneration (e.g. NPR per month)" : "तलब / पारिश्रमिक विवरण"}</label>
                <input
                  type="text"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Description (English)" : "दायित्व र विवरण (English)"}</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide brief outline of responsibilities, requirements..."
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#9A8A6A] uppercase font-bold mb-1">{language === "en" ? "Description (Nepali)" : "दायित्व र विवरण (नेपालीमा)"}</label>
                <textarea
                  rows={3}
                  value={newNpDesc}
                  onChange={(e) => setNewNpDesc(e.target.value)}
                  placeholder="जिम्मेवारी र कामका प्रावधानहरू लेख्नुहोस्..."
                  className="w-full bg-[#100C08] border border-[#D4A017]/15 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={posting}
                className="md:col-span-2 bg-[#D4A017] hover:bg-[#F5C842] text-black font-bold p-3 rounded-lg text-xs hover:scale-[1.01] transition-all cursor-pointer text-center"
              >
                {posting ? (language === "en" ? "Submitting..." : "सुरक्षित गरिंदै...") : (language === "en" ? "Publish Job Listing" : "जागिर प्रकाशित गर्नुहोस्")}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtering Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-[#9A8A6A]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={language === "en" ? "Search jobs by title, skills or city..." : "जागिर, सीप वा शहरबाट खोज्नुहोस्..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#080604] border border-[#D4A017]/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F9F3E3] font-sans"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 select-none">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 ${
                selectedCategory === c.value
                  ? "bg-[#D4A017] text-black shadow"
                  : "bg-[#080604] border border-[#D4A017]/15 text-[#9A8A6A] hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Board Listings */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#9A8A6A]">
          {language === "en" ? "Loading mountain registries..." : "म्याग्दीको तथ्यांक संकलन हुँदै..."}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-12 border border-dashed border-[#D4A017]/15 rounded-xl text-center flex flex-col items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[#9A8A6A]" />
          <p className="text-xs text-[#9A8A6A]">
            {language === "en" ? "No matches found. Create a free listing above!" : "कुनै विज्ञापन फेला परेन। माथिको बटन थिचेर थप्न सक्नुहुन्छ!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredJobs.map((j) => (
              <motion.div
                key={j.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#080604] border border-[#D4A017]/10 hover:border-[#D4A017]/35 p-4 rounded-xl transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[9px] font-extrabold uppercase bg-[#D4A017]/12 text-[#F5C842] px-2.5 py-1 rounded-full border border-[#D4A017]/15">
                      {j.type}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {language === "en" ? "Immediate" : "तुरुन्त"}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-[#F9F3E3] group-hover:text-[#FBBF24] transition-colors duration-200">
                    {language === "en" ? j.title : j.npTitle}
                  </h4>

                  <p className="text-xs text-[#9A8A6A] mt-2 leading-relaxed line-clamp-3">
                    {language === "en" ? j.description : j.npDescription}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D4A017]/8 flex flex-col gap-1 text-[10.5px]">
                  <div className="text-[#F5C842] flex items-center gap-1.5 font-sans font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{language === "en" ? j.location : j.npLocation}</span>
                  </div>
                  <div className="text-emerald-400 flex items-center gap-1.5 font-mono">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{j.salary}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
