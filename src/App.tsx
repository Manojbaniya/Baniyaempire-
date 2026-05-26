import { useState, useEffect } from "react";
import { Language, ComingSoonItem } from "./types";
import Header from "./components/Header";
import BeniJobsSection from "./components/BeniJobsSection";
import BeniDashEstimator from "./components/BeniDashEstimator";
import AiBeniDashModal from "./components/AiBeniDashModal";

// Interactive Lucide icon imports
import { 
  Award, 
  MapPin, 
  Navigation, 
  Compass, 
  Briefcase, 
  BookOpen, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Globe, 
  Users, 
  ExternalLink,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  Heart,
  Undo2,
  Calendar,
  Eye,
  GraduationCap,
  Volume2,
  Menu,
  X as CloseIcon
} from "lucide-react";

interface NepaliDateResult {
  year: number;
  monthIndex: number; // 0 for Baishakh, 11 for Chaitra
  day: number;
}

const NEP_MONTHS_EN = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEP_MONTHS_NP = [
  "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
];

const AD_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AD_MONTHS_NP = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];

const turnToNepaliDigits = (num: number | string): string => {
  const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return num.toString().split("").map(char => {
    const parsed = parseInt(char);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 9) {
      return nepaliDigits[parsed];
    }
    return char;
  }).join("");
};

function convertADtoBS_UTC(nepalDate: Date): NepaliDateResult {
  const anchors: { [key: number]: { startUTC: Date; daysInMonths: number[] } } = {
    2082: {
      startUTC: new Date(Date.UTC(2025, 3, 14)), // April 14, 2025 UTC
      daysInMonths: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 29]
    },
    2083: {
      startUTC: new Date(Date.UTC(2026, 3, 13)), // April 13, 2026 UTC
      daysInMonths: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]
    },
    2084: {
      startUTC: new Date(Date.UTC(2027, 3, 14)), // April 14, 2027 UTC
      daysInMonths: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 30]
    }
  };

  const dateYear = nepalDate.getFullYear();
  const dateMonth = nepalDate.getMonth();
  const dateDay = nepalDate.getDate();
  const targetUTC = new Date(Date.UTC(dateYear, dateMonth, dateDay));
  const targetTime = targetUTC.getTime();

  let bsYear = 2083;
  if (targetTime < anchors[2083].startUTC.getTime()) {
    bsYear = 2082;
  } else if (targetTime >= anchors[2084].startUTC.getTime()) {
    bsYear = 2084;
  }

  const anchor = anchors[bsYear] || anchors[2083];
  const diffTime = targetTime - anchor.startUTC.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { year: bsYear - 1, monthIndex: 11, day: 30 };
  }

  let remainingDays = diffDays;
  let bsMonthIndex = 0;
  let bsDay = 1;

  for (let i = 0; i < anchor.daysInMonths.length; i++) {
    const daysInMonth = anchor.daysInMonths[i];
    if (remainingDays < daysInMonth) {
      bsMonthIndex = i;
      bsDay = remainingDays + 1;
      break;
    }
    remainingDays -= daysInMonth;
  }

  return { year: bsYear, monthIndex: bsMonthIndex, day: bsDay };
}

export default function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<string>("overview"); // overview, benidash, benijobs, aibenidash, gurukul, visitmyagdi
  const [scrolled, setScrolled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [nepalTime, setNepalTime] = useState("");
  const [nepaliDate, setNepaliDate] = useState<NepaliDateResult | null>(null);
  const [gregorianDate, setGregorianDate] = useState<Date | null>(null);

  // Quiz State for Gurukul
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Coming Soon Filtering State
  const [comingSoonSearch, setComingSoonSearch] = useState("");
  const [comingSoonFilter, setComingSoonFilter] = useState("all");

  // Track window scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update clock relative to Beni, Nepal UTC + 5:45
  useEffect(() => {
    const calculateNepalTime = () => {
      const d = new Date();
      // Get UTC time milliseconds
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      // Nepal is UTC + 5:45
      const nepalOffset = 5.75;
      const nepalDate = new Date(utc + (3600000 * nepalOffset));
      
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setNepalTime(nepalDate.toLocaleTimeString('en-US', options));
      setGregorianDate(nepalDate);
      setNepaliDate(convertADtoBS_UTC(nepalDate));
    };

    calculateNepalTime();
    const interval = setInterval(calculateNepalTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Gurukul Lessons Datastore
  const GURUKUL_LESSONS = [
    {
      title: "Introduction to Digital Skills",
      npTitle: "डिजिटल साक्षरता परिचय",
      duration: "10 mins",
      topic: "Computers",
      content: {
        en: "Learn how the internet connects our village of Pula and Beni to the entire world. Web applications operate on servers, sending information in packets across cables and satellites to your mobile devices.",
        np: "हाम्रो पुला र बेनी गाउँलाई इन्टरनेटले कसरी पूरै संसारसँग जोड्छ भन्ने सिक्नुहोस्। वेब एपहरू सर्भरमा चल्छन्, जसले केबल र स्याटेलाइट मार्फत प्याकेटहरूमा तपाईंको मोबाइलसम्म जानकारी पठाउँछन्।"
      }
    },
    {
      title: "Mountain Agricultural Innovation",
      npTitle: "पहाडी कृषि प्रविधि",
      duration: "15 mins",
      topic: "Farming",
      content: {
        en: "Organic composting and gravity-fed drip irrigation allow higher crop yields on Myagdi's terraced hillsides. Farmers can increase revenues by 35% using local composting instead of chemical imports.",
        np: "म्याग्दीका कान्लाहरूमा प्रांगारिक मलको प्रयोग र थोपा सिँचाइले राम्रो उब्जनी दिन्छ। आयातित रासायनिक मल छोडेर स्थानीय कम्पोष्ट मल प्रयोग गर्दा आम्दानी ३५% सम्म बृद्धि हुन्छ।"
      }
    }
  ];

  // Gurukul Interactive Quiz
  const QUIZ_QUESTIONS = [
    {
      question: "Which high mountain peak is closely situated near the Myagdi District?",
      npQuestion: "म्याग्दी जिल्ला नजिकै अवस्थित प्रख्यात हिमाल कुन हो?",
      options: ["Mount Everest", "Dhaulagiri", "Kanchenjunga", "Lhotse"],
      npOptions: ["सगरमाथा", "धौलागिरी", "कञ्चनजंघा", "लोत्से"],
      answerIndex: 1, // Dhaulagiri
      explanation: "Dhaulagiri is the seventh highest mountain in the world and dominates the northern skyline of Myagdi district.",
      npExplanation: "धौलागिरी संसारको सातौं अग्लो हिमाल हो र यो म्याग्दी जिल्लाको उत्तरी भागमा पर्दछ।"
    },
    {
      question: "What is the administrative headquarters of the Myagdi District?",
      npQuestion: "म्याग्दी जिल्लाको सदरमुकाम कहाँ हो?",
      options: ["Pokhara", "Waling", "Beni", "Darwang"],
      npOptions: ["पोखरा", "वालिङ", "बेनी", "दरवाङ"],
      answerIndex: 2, // Beni
      explanation: "Beni Bazaar sits at the junction of the beautiful Kali Gandaki and Myagdi rivers.",
      npExplanation: "बेनी बजार रमणीय कालीगण्डकी र म्याग्दी नदीको दोभानमा अवस्थित छ।"
    }
  ];

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  // Tourism Places in Myagdi
  const MYAGDI_ATTRACTIONS = [
    {
      name: "Galeshwor Dham",
      npName: "गलेश्वर धाम",
      emoji: "🛕",
      bgGradient: "from-amber-600 to-orange-850",
      description: "A sacred Hindu temple dedicated to Lord Shiva, built built upon a single massive round rock at the bank of Kali Gandaki.",
      npDescription: "कालीगण्डकी नदीको किनारमा एउटै विशाल चक्रशिलामा स्थापित भगवान शिवको पवित्र मन्दिर।"
    },
    {
      name: "Tatopani Hot Spring",
      npName: "तातोपानी कुण्ड",
      emoji: "♨",
      bgGradient: "from-blue-600 to-cyan-850",
      description: "Famous natural hot water springs with high mineral content, known to heal various pains and skin ailments.",
      npDescription: "प्राकृतिक तातोपानीको मुहान तथा कुण्ड जसमा नुहाउँदा बाथ रोग र छाला सम्बन्धि समस्या निको हुने जनविश्वास छ।"
    },
    {
      name: "Dhaulagiri Round",
      npName: "धौलागिरी फेरो",
      emoji: "🏔️",
      bgGradient: "from-slate-600 to-zinc-850",
      description: "A challenging alpine trekking trail crossing French Pass with spectacular, raw views of glaciers and massive peaks.",
      npDescription: "फ्रेन्च पास पार गर्ने रोमाञ्चक हिमाली पदमार्ग जसले सेता धौलागिरी हिमाल र हिमनदीहरूको नजिकको दृश्य दिन्छ।"
    }
  ];

  // Coming Soon Items List
  const COMING_SOON_ITEMS: ComingSoonItem[] = [
    { emoji: "🚐", name: "BeniMove", npName: "बेनीमूभ", desc: "Reliable, comfortable van transit system connecting Beni Bazaar and Pokhara.", npDesc: "बेनी र पोखरालाई जोड्ने अत्याधुनिक आरामदायी पर्यटकीय पर्यटकीय भ्यान सेवा।", year: "2028", category: "transport" },
    { emoji: "🌾", name: "Baniya Farms", npName: "बनिया फार्म्स", desc: "Cooperative farming initiative providing fresh pesticide-free organic crops.", npDesc: "पुला र डाँडाखेतका कान्लाहरूबाट अर्गानिक, ताजा र स्वास्थ्यकर उपज कूपरेटिभ।", year: "2028", category: "agriculture" },
    { emoji: "💻", name: "BeniTech", npName: "बेनीटेक", desc: "Local customized IT services, custom software coding, and device training hub.", npDesc: "स्थानीय युवालाई प्रविधि तालिम र डिजिटल विकास सम्बन्धि काम गर्ने प्रविधि केन्द्र।", year: "2028", category: "education" },
    { emoji: "📡", name: "ConnectBeni", npName: "कनेक्टबेनी", desc: "High-speed community fiber internet targeting remote villages in Myagdi.", npDesc: "म्याग्दीका विकट पहाडी गाउँहरूमा तीव्र गतिको सामुदायिक इन्टरनेट सञ्जाल।", year: "2028", category: "infrastructure" },
    { emoji: "🏔️", name: "Visit Myagdi", npName: "भिजिट मयागडी", desc: "Eco-tourism portal with professional mountain guides and rafting bookers.", npDesc: "धौलागिरी फेरो र कालीगण्डकी र्याफ्टिङ यात्राको गाइड र टुर प्याकेज व्यवस्थापन।", year: "2029", category: "tourism" },
    { emoji: "🏨", name: "BeniStay", npName: "बेनीस्टे", desc: "Standard community homestay and luxury hotel directory for trekkers.", npDesc: "धौलागिरी घुम्न आउने पर्यटकहरूको लागि होटल र लोकल होमस्टे एकीकृत बुकिङ पोर्टल।", year: "2029", category: "hospitality" },
    { emoji: "⚡", name: "BeniGreen Solar", npName: "बेनीग्रीन सोलर", desc: "Clean, sustainable solar energy panels for remote mountain grids.", npDesc: "सौर्य ऊर्जा र विकट भेगहरूमा बिजुली विस्तार गर्ने हाम्रो वैकल्पिक ऊर्जा लक्ष्य।", year: "2029", category: "infrastructure" },
    { emoji: "🌊", name: "BeniRiver Rafting", npName: "बेनीरिभर र्याफ्टिङ", desc: "Kali Gandaki rapids river run experiences for global adventure seekers.", npDesc: "कालीगण्डकी नदीको आकर्षक छालहरूमा विश्वस्तरीय रोमान्चक र्याफ्टिङ सेवा।", year: "2029", category: "tourism" },
    { emoji: "🏠", name: "Baniya Properties", npName: "बनिया प्रपर्टिज", desc: "Fair trade real estate, land mapping, and community housing guides.", npDesc: "म्याग्दी भित्र व्यवस्थित जग्गा कारोबार, मूल्याङ्कन र गृह निर्माण सेवा।", year: "2029", category: "infrastructure" },
    { emoji: "📰", name: "Beni Press", npName: "बेनी प्रेस", desc: "Community publication focusing on rural opportunities and mountain stories.", npDesc: "पहाडी जीवन र स्थानीय अवसरहरूलाई समेट्ने हाम्रो आन्तरिक मुद्रण सेवा।", year: "2028", category: "media" },
    { emoji: "🎬", name: "Baniya Vision Media", npName: "बनिया भिजन मिडिया", desc: "Active YouTube channel and documentaries profiling Myagdi's raw beauty.", npDesc: "म्याग्दीको विकास र ग्रामीण पर्यटनको वृत्तचित्र प्रसारण गर्ने सक्रिय मिडिया च्यानल।", year: "Active", category: "media" },
    { emoji: "🕯️", name: "Hom Kumari Foundation", npName: "हजुरआमा फाउन्डेशन", desc: "Stipends and meals for underprivileged students, honoring homemaker grandmother.", npDesc: "हजुरआमा होम कुमारी बनियाको सम्झनामा विपन्न बालबालिकालाई छात्रवृत्ति र खाना सहयोग।", year: "2028", category: "foundation" }
  ];

  // Filter coming soon items
  const filteredComingSoon = COMING_SOON_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(comingSoonSearch.toLowerCase()) || 
                          item.npName.includes(comingSoonSearch) ||
                          item.desc.toLowerCase().includes(comingSoonSearch.toLowerCase());
    const matchesCat = comingSoonFilter === "all" || item.category === comingSoonFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#080604] font-sans text-[#F9F3E3] flex flex-col relative selection:bg-[#D4A017] selection:text-black">
      {/* Dynamic Header Component */}
      <Header 
        language={language} 
        setLanguage={setLanguage} 
        scrolled={scrolled} 
        onOpenChat={() => setIsChatOpen(true)} 
      />

      {/* Decorative Gradient Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-radial-gradient from-[#D4A017]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-radial-gradient from-red-900/8 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container Layout */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto pt-24 pb-14 px-4 md:px-8 flex flex-col lg:flex-row gap-6">
        
        {/* Mobile Sidebar Toggle Header (only on smaller screens) */}
        <div className="lg:hidden flex items-center justify-between bg-[#100C08] border border-[#D4A017]/20 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#F5C842]">
              {language === "en" ? "BANIYA EMPIRE RADAR" : "बनिया साम्राज्य जानकारी"}
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1 bg-[#D4A017]/10 border border-[#D4A017]/25 px-3 py-1.5 rounded-lg text-xs text-[#F5C842] font-semibold cursor-pointer"
          >
            {isSidebarOpen ? <CloseIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>{isSidebarOpen ? (language === "en" ? "Hide Radar" : "बन्द गर्नुहोस्") : (language === "en" ? "View Radar" : "मेनु हेर्नुस्")}</span>
          </button>
        </div>

        {/* Left Sidebar Vision Rail */}
        <aside 
          className={`w-full lg:w-72 shrink-0 flex flex-col gap-6 lg:block ${
            isSidebarOpen ? "block" : "hidden lg:block"
          }`}
        >
          {/* Timeline Node */}
          <div className="bg-[#100C08] border border-[#D4A017]/15 rounded-2xl p-6 mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#9A8A6A] font-extrabold mb-5 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>{language === "en" ? "The Roadmap" : "हाम्रो लक्ष्य योजना"}</span>
            </h3>

            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[#D4A017]/20">
              
              {/* Event 1 */}
              <div className="relative pl-7 flex flex-col">
                <div className="absolute left-0 top-[3px] w-6 h-6 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/50 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping" />
                  <span className="absolute w-2 h-2 rounded-full bg-[#22C55E]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-white bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">2026</span>
                  <span className="text-[9px] uppercase text-[#22C55E] font-bold tracking-wider">{language === "en" ? "Today" : "आज"}</span>
                </div>
                <h4 className="text-white text-xs font-bold mt-1 uppercase font-serif tracking-tight">
                  {language === "en" ? "4 Apps Live" : "४ एप्स पूर्ण सक्रिय"}
                </h4>
                <p className="text-[11px] text-[#9A8A6A] mt-0.5 leading-snug">
                  {language === "en" ? "Universal digital ecosystem serving Myagdi." : "राइड, डेलिभरी, रोजगार, कृत्रिम बुद्धिमत्ता र गुरुकुल सेवा।"}
                </p>
              </div>

              {/* Event 2 */}
              <div className="relative pl-7 flex flex-col">
                <div className="absolute left-[5px] top-[5px] w-3 h-3 rounded-full bg-[#080604] border border-[#9A8A6A]" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#F5C842]">2028</span>
                  <span className="text-[9px] uppercase text-amber-500 font-bold tracking-wider">{language === "en" ? "Expanding" : "विस्तार"}</span>
                </div>
                <h4 className="text-[#F9F3E3] text-xs font-bold mt-1 uppercase font-serif tracking-tight">
                  {language === "en" ? "BeniMove & Farms" : "बेनीमूभ र बनिया फार्म्स"}
                </h4>
                <p className="text-[11px] text-[#9A8A6A] mt-0.5 leading-snug">
                  {language === "en" ? "Van routing, organic co-op, and 200+ local jobs." : "बेनी-पोखरा पर्यटन यातायात र अर्गानिक तरकारी कूपरेटिभ।"}
                </p>
              </div>

              {/* Event 3 */}
              <div className="relative pl-7 flex flex-col">
                <div className="absolute left-[5px] top-[5px] w-3 h-3 rounded-full bg-[#080604] border border-[#9A8A6A]" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#F5C842]">2030</span>
                  <span className="text-[9px] uppercase text-amber-500 font-bold tracking-wider">{language === "en" ? "Full integration" : "सुदृढीकरण"}</span>
                </div>
                <h4 className="text-[#F9F3E3] text-xs font-bold mt-1 uppercase font-serif tracking-tight">
                  {language === "en" ? "17 Integrated Units" : "१७ व्यावसायिक उद्योग"}
                </h4>
                <p className="text-[11px] text-[#9A8A6A] mt-0.5 leading-snug">
                  {language === "en" ? "Hydro solar grids, eco lodges, 500+ local hires." : "वैकल्पिक सौर्य ऊर्जा, कालीगण्डकी र्याफ्टिङ र होटल चेन।"}
                </p>
              </div>

              {/* Event 4 */}
              <div className="relative pl-7 flex flex-col">
                <div className="absolute left-[5px] top-[5px] w-3 h-3 rounded-full bg-[#080604] border border-[#D4A017] shadow-[0_0_8px_rgba(212,160,23,0.5)]" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#D4A017]">2036</span>
                  <span className="text-[9px] uppercase text-[#D4A017] font-bold tracking-wider">{language === "en" ? "Sustainability" : "दिगो विकास"}</span>
                </div>
                <h4 className="text-[#D4A017] text-xs font-bold mt-1 uppercase font-serif tracking-tight">
                  {language === "en" ? "Green Energy Grid" : "हरित ऊर्जा ग्रिड"}
                </h4>
                <p className="text-[11px] text-[#9A8A6A] mt-0.5 leading-snug">
                  {language === "en" ? "100% self-sufficient solar hydro framework for remote villages." : "गाउँघरमा पूर्ण आत्मनिर्भर नवीकरणीय ऊर्जाको विस्तार।"}
                </p>
              </div>
            </div>
          </div>

          {/* Grandmother Quote Node */}
          <div className="bg-[#100C08] border border-[#D4A017]/15 rounded-2xl p-6 text-center relative overflow-hidden group">
            <span className="absolute -top-6 -left-6 text-8xl opacity-5 pointer-events-none text-[#F5C842] font-serif">“</span>
            
            <p className="text-xs italic text-[#9A8A6A] leading-relaxed relative z-10">
              {language === "en"
                ? '"Myagdi gave us everything — our mountains, our values, our grandmother Hom Kumari Baniya who worked tirelessly so her family could thrive. Our promise is to bring opportunity back to these hills."'
                : '"म्याग्दीले हामीलाई सबथोक दियो — हाम्रा पहाड, हाम्रो संस्कार, हाम्री हजुरआमा होम कुमारी बनिया जसले परिवार चलाउन जीवनभर दुःख गर्नुभयो। यो साम्राज्य म्याग्दीमा सुख फर्काउने साझा वाचा हो।"'}
            </p>

            <div className="mt-4 pt-4 border-t border-[#D4A017]/10">
              <p className="text-[11px] font-extrabold text-[#D4A017] tracking-wider uppercase font-sans">
                {language === "en" ? "— Baniya Empire Legacy" : "— बनिया साम्राज्य परिवार"}
              </p>
              <p className="text-[9px] text-[#9A8A6A] block mt-1 font-mono">
                {language === "en" ? "Pula, Dandakhet • Beni, Myagdi" : "पुला, डाँडाखेत • बेनी, म्याग्दी"}
              </p>
            </div>
          </div>
        </aside>

        {/* Central Workspace / Live Console */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Dashboard Hub Header Card */}
          <div className="bg-[#100C08] border border-[#D4A017]/15 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-44 h-44 bg-[#D4A017]/5 blur-3xl rounded-full pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-[#D4A017]/12 text-[#F5C842] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#D4A017]/20">
                  {language === "en" ? "Baniya Empire Console v1.4" : "एकीकृत कन्सोल संस्करण १.४"}
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl md:text-3.5xl text-white tracking-tight leading-tight">
                {language === "en" ? "Serving Our" : "हाम्रो"}{" "}
                <span className="italic text-[#D4A017]">Myagdi</span>{" "}
                {language === "en" ? "District" : "जिल्ला"}
              </h1>
              <p className="text-xs text-[#9A8A6A] mt-1.5 font-light">
                {language === "en" 
                  ? "Real-time digital tools supporting mountain economies and local empowerment."
                  : "पहाडी अर्थतन्त्र मजबुत बनाउन तथा स्थानीय स्वरोजगारलाई बढावा दिने प्रविधि मञ्च।"}
              </p>
            </div>

            {/* Live Clock with UTC +5:45, Nepali BS, and AD Date */}
            <div className="bg-[#080604] border border-[#D4A017]/15 rounded-xl px-5 py-3 text-left md:text-right flex flex-col gap-1.5 mt-3 md:mt-0 shadow-inner min-w-[210px] w-full md:w-auto">
              <div className="flex items-center md:justify-end gap-1.5 text-[#F5C842]">
                <Clock className="w-4 h-4 text-[#D4A017] animate-pulse" />
                <span className="text-base md:text-lg font-mono font-bold tracking-tight text-white select-all">{nepalTime || "00:00:00 AM"}</span>
              </div>
              
              {nepaliDate && gregorianDate && (
                <div className="flex flex-col gap-0.5 border-t border-[#D4A017]/10 pt-1.5 text-[11px] font-mono leading-tight">
                  {/* Nepali BS Date */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 text-[#F5C842]">
                    <span className="text-[9px] text-[#9A8A6A] font-sans font-bold tracking-wider uppercase">
                      {language === "en" ? "BS:" : "वि.सं.:"}
                    </span>
                    <span className="font-bold">
                      {language === "en" ? (
                        `${NEP_MONTHS_EN[nepaliDate.monthIndex]} ${nepaliDate.day}, ${nepaliDate.year}`
                      ) : (
                        `${turnToNepaliDigits(nepaliDate.year)} ${NEP_MONTHS_NP[nepaliDate.monthIndex]} ${turnToNepaliDigits(nepaliDate.day)}`
                      )}
                    </span>
                  </div>

                  {/* AD Date */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 text-[#9A8A6A]">
                    <span className="text-[9px] font-sans font-bold tracking-wider uppercase">
                      {language === "en" ? "AD:" : "सन्:"}
                    </span>
                    <span className="font-semibold text-[10.5px]">
                      {language === "en" ? (
                        `${AD_MONTHS_EN[gregorianDate.getMonth()].slice(0,3)} ${gregorianDate.getDate()}, ${gregorianDate.getFullYear()}`
                      ) : (
                        `${turnToNepaliDigits(gregorianDate.getFullYear())} ${AD_MONTHS_NP[gregorianDate.getMonth()]} ${turnToNepaliDigits(gregorianDate.getDate())}`
                      )}
                    </span>
                  </div>
                </div>
              )}
              
              <p className="text-[9px] uppercase font-bold tracking-widest text-[#9A8A6A] mt-0.5 border-t border-[#D4A017]/5 pt-1 text-left md:text-right select-none">
                {language === "en" ? "Beni Live Clock" : "बेनी लाइभ घडी"}
              </p>
            </div>
          </div>

          {/* Tab Selection Row */}
          <div className="flex border-b border-[#D4A017]/15 bg-[#100C08] p-1.5 rounded-xl gap-1 overflow-x-auto select-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#D4A017] text-[#080604] shadow-md"
                  : "text-[#9A8A6A] hover:bg-[#D4A017]/5 hover:text-[#F9F3E3]"
              }`}
            >
              📊 {language === "en" ? "Ecosystem Grid" : "इकोसिस्टम"}
            </button>
            <button
              onClick={() => setActiveTab("benidash")}
              className={`px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "benidash"
                  ? "bg-[#D4A017] text-[#080604] shadow-md"
                  : "text-[#9A8A6A] hover:bg-[#D4A017]/5 hover:text-[#F9F3E3]"
              }`}
            >
              🛵 BeniDash
            </button>
            <button
              onClick={() => setActiveTab("benijobs")}
              className={`px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "benijobs"
                  ? "bg-[#D4A017] text-[#080604] shadow-md"
                  : "text-[#9A8A6A] hover:bg-[#D4A017]/5 hover:text-[#F9F3E3]"
              }`}
            >
              💼 BeniJobs Nepal
            </button>
            <button
              onClick={() => setActiveTab("gurukul")}
              className={`px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "gurukul"
                  ? "bg-[#D4A017] text-[#080604] shadow-md"
                  : "text-[#9A8A6A] hover:bg-[#D4A017]/5 hover:text-[#F9F3E3]"
              }`}
            >
              📚 Gurukul Hub
            </button>
            <button
              onClick={() => setActiveTab("visitmyagdi")}
              className={`px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "visitmyagdi"
                  ? "bg-[#D4A017] text-[#080604] shadow-md"
                  : "text-[#9A8A6A] hover:bg-[#D4A017]/5 hover:text-[#F9F3E3]"
              }`}
            >
              🧭 {language === "en" ? "Explore Myagdi" : "म्याग्दी दर्शन"}
            </button>
          </div>

          {/* Official Subdomain Portals Links Banner */}
          <div className="bg-[#100C08] border border-[#D4A017]/30 rounded-2xl p-4 md:p-5 flex flex-col gap-4 relative overflow-hidden shadow-[0_0_20px_rgba(212,160,23,0.06)]">
            <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-[#D4A017]/5 blur-2xl rounded-full pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#D4A017]/15 pb-3">
              <div>
                <h3 className="font-serif font-black text-xs md:text-sm text-white tracking-wide uppercase flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {language === "en" ? "Baniya Empire Official Portals & Subdomains" : "बनिया साम्राज्यका आधिकारिक वेब पोर्टलहरू"}
                </h3>
                <p className="text-[10px] text-[#9A8A6A] mt-0.5">
                  {language === "en" ? "Direct portal gateways linking you with live subdomains in Myagdi" : "म्याग्दीका लाइभ सेवाहरूमा सुरक्षित र नि:शुल्क पहुँचको लागि आधिकारिक लिङ्कहरू"}
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-[#D4A017]/10 px-3 py-1 rounded-full border border-[#D4A017]/20">
                <Globe className="w-3 h-3 text-[#F5C842]" />
                <span className="text-[10px] text-[#F5C842] font-semibold tracking-wide uppercase">
                  {language === "en" ? "Official Live Gateway" : "आधिकारिक गेटवे"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                {
                  label_en: "Ride & Delivery",
                  label_np: "सवारी र डेलिभरी",
                  desc_en: "Order food, rides & express transport",
                  desc_np: "खाना, औषधि डेलिभरी र यात्रा बुकिङ",
                  subdomain: "benidash.com",
                  href: "https://benidash.com",
                  emoji: "🛵",
                  color: "border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/3"
                },
                {
                  label_en: "Jobs Board",
                  label_np: "रोजगार मञ्च",
                  desc_en: "Regional jobs for local youths",
                  desc_np: "स्थानीय युवा जागरण र सशुल्क रोजगार",
                  subdomain: "benijobsnepal.benidash.com",
                  href: "https://benijobsnepal.benidash.com",
                  emoji: "💼",
                  color: "border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/3"
                },
                {
                  label_en: "AI Assistant",
                  label_np: "एआई डिजिटल गुरु",
                  desc_en: "24/7 mountain-savvy AI chat",
                  desc_np: "म्याग्दी स्थानीय ज्ञान र कृत्रिम बुद्धिमत्ता",
                  subdomain: "aibenidash.benidash.com",
                  href: "https://aibenidash.benidash.com",
                  emoji: "🤖",
                  color: "border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/3"
                },
                {
                  label_en: "Gurukul Hub",
                  label_np: "विद्यार्थी गुरुकुल",
                  desc_en: "Free online courses & study guides",
                  desc_np: "बालबालिकाका लागि अनलाइन निशुल्क ट्युसन",
                  subdomain: "benidashgurukul.benidash.com",
                  href: "https://benidashgurukul.benidash.com",
                  emoji: "📚",
                  color: "border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/3"
                }
              ].map((portal, idx) => (
                <a
                  key={idx}
                  href={portal.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block bg-[#080604] border ${portal.color} p-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_4px_14px_rgba(212,160,23,0.08)]`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{portal.emoji}</span>
                    <span className="font-semibold text-xs text-white group-hover:text-[#F5C842] transition-colors">
                      {language === "en" ? portal.label_en : portal.label_np}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#9A8A6A] group-hover:text-[#F5C842] ml-auto transition-colors" />
                  </div>
                  <div className="text-[10px] text-[#9A8A6A] leading-tight group-hover:text-[#F9F3E3] transition-colors mb-2.5 min-h-[28px] flex items-center">
                    {language === "en" ? portal.desc_en : portal.desc_np}
                  </div>
                  <div className="text-[9.5px] font-mono text-[#D4A017] group-hover:text-[#F5C842] font-semibold break-all leading-none bg-[#D4A017]/5 p-1 rounded border border-[#D4A017]/10 text-center">
                    {portal.subdomain}
                  </div>
                </a>
              ))}
            </div>
            
            {/* Direct rider/merchant signups matching post */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-[#9A8A6A] bg-[#0c0906] p-3 rounded-xl border border-[#D4A017]/5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold text-[#D4A017] uppercase tracking-wider text-[9px]">
                  {language === "en" ? "Registration Portal:" : "भर्ना तथा दर्ता पोर्टल:"}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  🛵 {language === "en" ? "Rider (Earn daily):" : "चालक (दैनिक आम्दानी):"}
                  <a href="https://benidash.com" target="_blank" rel="noopener noreferrer" className="text-[#F5C842] hover:underline font-bold">benidash.com</a>
                </span>
                <span className="text-[#D4A017]/30 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 font-mono">
                  Store {language === "en" ? "Partner:" : "साझेदार बन्नुस्:"}
                  <a href="https://benidash.com" target="_blank" rel="noopener noreferrer" className="text-[#F5C842] hover:underline font-bold">benidash.com</a>
                </span>
              </div>
              <div className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded font-mono border border-emerald-500/20 select-none">
                {language === "en" ? "Myagdi's Digital Era Is Here" : "म्याग्दीको आफ्नै डिजिटल मञ्च 🏔️"}
              </div>
            </div>
          </div>

          {/* Active Workspace Container */}
          <div className="flex-1">

            {/* TAB 1: OVERVIEW BENTO GRID */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* 4 Flagship interactive gateways */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: BeniDash */}
                  <div className="group relative bg-[#100C08] border border-orange-500/15 hover:border-orange-500/40 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl">🛵</span>
                        <span className="text-[9px] bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase">
                          {language === "en" ? "Rides & Delivery" : "सवारी र डेलिभरी"}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white group-hover:text-orange-400 transition-colors">BeniDash</h3>
                      <p className="text-[11px] text-orange-200/50 mb-3 block font-mono">बेनीडेश — राइड र डेलिभरी</p>
                      <p className="text-xs text-[#9A8A6A] leading-relaxed mb-4">
                        {language === "en"
                          ? "Connecting kitchens, dispensaries, and stores directly to our clients in Beni and neighboring sites."
                          : "बेनीका पसल तथा औषधि गृहबाट घरदैलो सम्मका डेलिभरी सेवा तथा द्रुत सवारी साधन बुकिङ।"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-auto">
                      <button
                        onClick={() => setActiveTab("benidash")}
                        className="text-[11px] font-extrabold text-orange-400 focus:outline-none flex items-center gap-1.5 group-hover:underline cursor-pointer"
                      >
                        <span>{language === "en" ? "Open Rate Estimator" : "भाडा दर अनुमान कन्सोल"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-emerald-500 font-mono font-bold">100% Active</span>
                    </div>
                  </div>

                  {/* Card 2: BeniJobs */}
                  <div className="group relative bg-[#100C08] border border-blue-500/15 hover:border-blue-500/40 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl">💼</span>
                        <span className="text-[9px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase">
                          {language === "en" ? "Opportunities" : "रोजगार बोर्ड"}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white group-hover:text-blue-400 transition-colors">BeniJobs Nepal</h3>
                      <p className="text-[11px] text-blue-200/50 mb-3 block font-mono">बेनीजब्स — जागिर खोज्नुस्</p>
                      <p className="text-xs text-[#9A8A6A] leading-relaxed mb-4">
                        {language === "en"
                          ? "Connecting local youth with dignified regional work. Free job listings for all mountain merchants."
                          : "नेपालभरीका र विशेषगरी बेनीका स्थानीय व्यवसायहरू र योग्य युवा जनशक्ति जोड्ने सुदृढ पुल।"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-auto">
                      <button
                        onClick={() => setActiveTab("benijobs")}
                        className="text-[11px] font-extrabold text-blue-400 focus:outline-none flex items-center gap-1.5 group-hover:underline cursor-pointer"
                      >
                        <span>{language === "en" ? "Explore Jobs Board" : "रोजगार विज्ञापनहरू हेर्नुस्"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-emerald-500 font-mono font-bold">Free access</span>
                    </div>
                  </div>

                  {/* Card 3: AI BeniDash */}
                  <div className="group relative bg-[#100C08] border border-purple-500/15 hover:border-purple-500/40 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl">🤖</span>
                        <span className="text-[9px] bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase">
                          {language === "en" ? "Smart Assistant" : "आर्टिफिसियल इन्टेलिजेन्स"}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white group-hover:text-purple-400 transition-colors">AI BeniDash</h3>
                      <p className="text-[11px] text-purple-200/50 mb-3 block font-mono">नेपालको आफ्नै AI सहायक</p>
                      <p className="text-xs text-[#9A8A6A] leading-relaxed mb-4">
                        {language === "en"
                          ? "Interactive smart model fluent in Nepali, English & Local Myagdi context."
                          : "नेपाली र अंग्रेजी भाषा बुझ्ने, स्थानीय सल्लाह, कृषि र गृहकार्य सिकाउने चलाख डिजिटल गुरु।"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-auto">
                      <button
                        onClick={() => setIsChatOpen(true)}
                        className="text-[11px] font-extrabold text-purple-300 focus:outline-none flex items-center gap-1.5 group-hover:underline cursor-pointer"
                      >
                        <span>{language === "en" ? "Launch Copilot Dialog" : "एआई सहायकसँग कुरा गर्ने"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-[#F3E8FF] bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30 font-bold">GENAI ON</span>
                    </div>
                  </div>

                  {/* Card 4: Gurukul */}
                  <div className="group relative bg-[#100C08] border border-emerald-500/15 hover:border-emerald-500/40 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl">📚</span>
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase">
                          {language === "en" ? "Education Portal" : "निःशुल्क डिजिटल विद्यालय"}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">BeniDash Gurukul</h3>
                      <p className="text-[11px] text-emerald-200/50 mb-3 block font-mono font-nepali">बेनीडेश गुरुकुल — सिक्नुस्!</p>
                      <p className="text-xs text-[#9A8A6A] leading-relaxed mb-4">
                        {language === "en"
                          ? "Universal barrier-free training for children of Myagdi. Computers and farming modules."
                          : "म्याग्दीका सम्पूर्ण बालबालिकाहरूका लागि निःशुल्क डिजिटल शिक्षा, सीप विकास र ई-लर्निङ।"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-auto">
                      <button
                        onClick={() => setActiveTab("gurukul")}
                        className="text-[11px] font-extrabold text-emerald-400 focus:outline-none flex items-center gap-1.5 group-hover:underline cursor-pointer"
                      >
                        <span>{language === "en" ? "Study Free Now" : "अध्ययन सुरु गर्नुहोस्"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-emerald-500 font-mono font-bold">1,200+ Scholars</span>
                    </div>
                  </div>

                </div>

                {/* Subtitle for Coming Soon Registry */}
                <div className="pt-6 border-t border-[#D4A017]/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="font-serif text-2xl font-black text-white">
                        {language === "en" ? "Upcoming Strategic Businesses" : "आगामी थप १३ नयाँ व्यवसायहरू"}
                      </h2>
                      <p className="text-xs text-[#9A8A6A]">
                        {language === "en" ? "13 additional modules to complete the grand ecosystem." : "म्याग्दीको विकासका निम्ति बनिया साम्राज्यका योजनाबद्ध १३ नयाँ उद्योगहरू।"}
                      </p>
                    </div>

                    {/* Filter UI for coming soon */}
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-xs text-[#9A8A6A] font-medium hidden md:inline">Filter:</span>
                      <select
                        value={comingSoonFilter}
                        onChange={(e) => setComingSoonFilter(e.target.value)}
                        className="bg-[#080604] border border-[#D4A017]/25 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="all">All Sectors</option>
                        <option value="transport">Transport</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="education">Education</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="tourism">Tourism / Travel</option>
                        <option value="media">Media & Press</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid for upcoming projects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {filteredComingSoon.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#100C08] border border-white/5 hover:border-[#D4A017]/35 rounded-xl p-4 transition-all duration-300 group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-[9px] font-extrabold uppercase bg-[#D4A017]/8 text-[#F5C842] px-2 py-0.5 rounded border border-[#D4A017]/10">
                            {item.year === "Active" ? (language === "en" ? "ACTIVE" : "सक्रिय") : `Est ${item.year}`}
                          </span>
                        </div>
                        <h4 className="font-serif text-[13px] text-white font-bold tracking-tight">
                          {language === "en" ? item.name : item.npName}
                        </h4>
                        <p className="text-[11px] text-[#9A8A6A] mt-1.5 leading-relaxed">
                          {language === "en" ? item.desc : item.npDesc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: BENIDASH COMPONENT */}
            {activeTab === "benidash" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Embedded dynamic Estimator */}
                <BeniDashEstimator language={language} />

                {/* Info and Delivery Guidelines Card */}
                <div className="bg-[#100C08] border border-orange-500/15 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-black text-white text-lg mb-3 flex items-center gap-1.5">
                      <TrendingUp className="text-orange-400 w-5 h-5" />
                      <span>{language === "en" ? "BeniDash Delivery Rules" : "बेनीडेश डेलिभरीका नियमहरू"}</span>
                    </h3>
                    
                    <ul className="text-xs text-[#9A8A6A] space-y-3 list-none">
                      <li className="relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-orange-400 before:font-bold">
                        <strong>{language === "en" ? "Fast Transit" : "छिटो डेलिभरी"}:</strong> {language === "en" ? "Riders target local Beni Bazaar deliveries under 20 minutes." : "बेनी बजारभित्र २० मिनेटमा अर्डर डेलिभरी हुने ग्यारेन्टी।"}
                      </li>
                      <li className="relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-orange-400 before:font-bold">
                        <strong>{language === "en" ? "Remote Routing" : "पहाडी रूटहरू"}:</strong> {language === "en" ? "Deliveries to Pula, Galeshwor, and Tatopani are supported daily via off-road motorbikes." : "पुला, गलेश्वर र तातोपानी क्षेत्रहरूमा पनि दैनिक डेलिभरी सेवा उपलब्ध छ।"}
                      </li>
                      <li className="relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-orange-400 before:font-bold">
                        <strong>{language === "en" ? "Community Support" : "सामुदायिक सहयोग"}:</strong> {language === "en" ? "Subsidized transport rates for life-saving medicine packages." : "स्वास्थ्य सम्बन्धि अत्यावश्यक औषधिको आपूर्तिमा विशेष सहुलियत।"}
                      </li>
                    </ul>

                    {/* Rider opportunities info block */}
                    <div className="bg-[#080604] border border-[#D4A017]/15 rounded-xl p-4 mt-6">
                      <h4 className="text-xs text-[#F5C842] font-extrabold uppercase mb-2">
                        💡 {language === "en" ? "Want to Earn NPR 400-700/day?" : "दैनिक ४००-७०० कमाउन चाहनुहुन्छ?"}
                      </h4>
                      <p className="text-[11px] text-[#9A8A6A] leading-relaxed">
                        {language === "en"
                          ? "Join as an active BeniDash Delivery Rider. Flexible hours, full insurance, and high demand around shopping hours."
                          : "बेनीडेशमा राइडर बन्नुहोस्। आफ्नो अनुकूल समयमा काम गरी आर्थिक आत्मनिर्भर बन्नुहोस्।"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
                    <span className="text-[10px] text-[#9A8A6A]">
                      {language === "en" ? "Merchants listed: 32 and counting" : "आबद्ध पसलहरू: ३२+"}
                    </span>
                    <a
                      href="https://benidash.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-orange-500 hover:bg-orange-600 text-black font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      <span>benidash.com ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BENIJOBS LIVE BOARD */}
            {activeTab === "benijobs" && (
              <BeniJobsSection language={language} />
            )}

            {/* TAB 4: GURUKUL HUB */}
            {activeTab === "gurukul" && (
              <div className="space-y-6">
                
                {/* Introduction banner */}
                <div className="bg-gradient-to-br from-[#100C08] to-[#1F170D] border border-emerald-500/20 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-[#86EFAC] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      🎓 {language === "en" ? "BeniDash Gurukul Program" : "बेनीडेश गुरुकुल कार्यक्रम"}
                    </span>
                    <h2 className="font-serif text-2xl font-black text-white mt-3">
                      {language === "en" ? "Free IT & Agricultural Literacy" : "निःशुल्क कम्प्युटर तथा वैज्ञानिक कृषि शिक्षा"}
                    </h2>
                    <p className="text-xs text-[#9A8A6A] mt-2 max-w-xl leading-relaxed">
                      {language === "en"
                        ? "Empowering children and farmers across Myagdi through targeted classes to build locally rather than migrating abroad."
                        : "म्याग्दीका बालबालिकालाई डिजिटल सीप र कृषकहरूलाई आधुनिक खेती सिकाएर पहाडमै बस्न प्रेरित गर्ने हाम्रो शैक्षिक अभियान।"}
                    </p>
                  </div>
                  
                  <span className="text-5xl opacity-80 select-none">📚</span>
                </div>

                {/* Study & Quiz grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left: Study Lesson Cards */}
                  <div className="space-y-4">
                    <h3 className="font-serif font-black text-lg text-white flex items-center gap-2">
                      <GraduationCap className="text-[#D4A017] w-5 h-5" />
                      <span>{language === "en" ? "Available Audio & Digital Lessons" : "उपलब्ध डिजिटल कक्षाहरू"}</span>
                    </h3>

                    {GURUKUL_LESSONS.map((lesson, idx) => (
                      <div key={idx} className="bg-[#100C08] border border-[#D4A017]/10 rounded-xl p-5 hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                            {lesson.topic}
                          </span>
                          <span className="text-[10px] text-[#9A8A6A]">{lesson.duration}</span>
                        </div>
                        <h4 className="font-bold text-sm text-white">{language === "en" ? lesson.title : lesson.npTitle}</h4>
                        <p className="text-xs text-[#9A8A6A] mt-2 leading-relaxed">
                          {language === "en" ? lesson.content.en : lesson.content.np}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Right: Interactive School Quiz */}
                  <div className="bg-[#100C08] border border-[#D4A017]/15 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-serif font-black text-base text-white">
                          🧭 {language === "en" ? "Myagdi Scholars Quiz" : "म्याग्दी ज्ञान हाजिरीजवाफ"}
                        </h3>
                        <span className="text-[10px] bg-[#D4A017]/10 text-[#F5C842] px-2.5 py-1 rounded font-mono font-bold">
                          {language === "en" ? `Question ${currentQuizIndex + 1}/${QUIZ_QUESTIONS.length}` : `प्रश्न ${currentQuizIndex + 1}/${QUIZ_QUESTIONS.length}`}
                        </span>
                      </div>

                      {!quizFinished ? (
                        <div className="space-y-4">
                          {/* Question text */}
                          <p className="text-xs text-[#F9F3E3] font-medium leading-relaxed bg-[#080604] p-3 rounded-lg border border-[#D4A017]/10">
                            {language === "en" ? QUIZ_QUESTIONS[currentQuizIndex].question : QUIZ_QUESTIONS[currentQuizIndex].npQuestion}
                          </p>

                          {/* Options list */}
                          <div className="space-y-2">
                            {(language === "en" ? QUIZ_QUESTIONS[currentQuizIndex].options : QUIZ_QUESTIONS[currentQuizIndex].npOptions).map((option, optIdx) => {
                              const isCorrect = optIdx === QUIZ_QUESTIONS[currentQuizIndex].answerIndex;
                              const isSelected = selectedAnswer === optIdx;
                              
                              let btnClass = "bg-[#080604] border-[#D4A017]/15 text-[#9A8A6A] hover:bg-[#D4A017]/5";
                              
                              if (selectedAnswer !== null) {
                                if (isCorrect) {
                                  btnClass = "bg-emerald-550/20 border-emerald-500 text-emerald-400 font-bold";
                                } else if (isSelected) {
                                  btnClass = "bg-red-500/10 border-red-500 text-red-400";
                                } else {
                                  btnClass = "opacity-40 bg-[#080604] border-[#D4A017]/5 text-[#9A8A6A]";
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={selectedAnswer !== null}
                                  onClick={() => {
                                    setSelectedAnswer(optIdx);
                                    if (optIdx === QUIZ_QUESTIONS[currentQuizIndex].answerIndex) {
                                      setQuizScore(prev => prev + 10);
                                    }
                                  }}
                                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                                >
                                  <span>{option}</span>
                                  {selectedAnswer !== null && isCorrect && <span className="text-emerald-400">✓</span>}
                                  {selectedAnswer !== null && isSelected && !isCorrect && <span className="text-red-400">✗</span>}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation expander */}
                          {selectedAnswer !== null && (
                            <div className="bg-[#D4A017]/5 border border-[#D4A017]/15 rounded-lg p-3 text-[11px] text-[#9A8A6A] leading-relaxed">
                              <span className="font-bold text-[#F5C842] block mb-1">
                                {language === "en" ? "Explanation:" : "विवरण:"}
                              </span>
                              {language === "en" ? QUIZ_QUESTIONS[currentQuizIndex].explanation : QUIZ_QUESTIONS[currentQuizIndex].npExplanation}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <span className="text-4xl">🏆</span>
                          <h4 className="text-base text-white font-serif font-black mt-3">
                            {language === "en" ? "Quiz Completed!" : "हाजिरीजवाफ सम्पन्न!"}
                          </h4>
                          <p className="text-xs text-[#9A8A6A] mt-2">
                            {language === "en" ? `You scored ${quizScore} points!` : `तपाईंले जम्मा ${quizScore} अंक प्राप्त गर्नुभयो।`}
                          </p>
                          <button
                            onClick={handleResetQuiz}
                            className="bg-[#D4A017] hover:bg-[#F5C842] text-black font-bold px-4 py-2 rounded-lg text-xs mt-4 cursor-pointer"
                          >
                            {language === "en" ? "Play Again" : "पुनः खेल्नुहोस्"}
                          </button>
                        </div>
                      )}
                    </div>

                    {!quizFinished && selectedAnswer !== null && (
                      <button
                        onClick={handleNextQuiz}
                        className="w-full bg-[#D4A017] hover:bg-[#F5C842] text-black font-bold p-3 rounded-lg text-xs mt-4 hover:scale-[1.01] transition-all cursor-pointer text-center"
                      >
                        {currentQuizIndex < QUIZ_QUESTIONS.length - 1 
                          ? (language === "en" ? "Next Question" : "अर्को प्रश्न") 
                          : (language === "en" ? "Finish & Get Score" : "अन्तिम नतिजा हेर्नुस्")}
                      </button>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* TAB 5: VISIT MYAGDI TOURISM MODULE */}
            {activeTab === "visitmyagdi" && (
              <div className="space-y-6">
                
                {/* Introduction header */}
                <div className="bg-[#100C08] border border-[#D4A017]/15 p-6 rounded-2xl">
                  <h3 className="font-serif font-black text-xl text-white flex items-center gap-1.5 mb-2">
                    <Compass className="text-[#D4A017] w-5 h-5 animate-spin" />
                    <span>{language === "en" ? "Visit Myagdi Eco-Homestay Portal" : "भिजिट म्याग्दी ग्रामीण पर्यटन जानकारी"}</span>
                  </h3>
                  <p className="text-xs text-[#9A8A6A] leading-relaxed">
                    {language === "en"
                      ? "Explore beautiful treks of the Dhaulagiri district, divine temples, and relax in healing natural hot springs. Built to boost local tourism revenues directly to families of Myagdi."
                      : "धौलागिरी परिक्रमा, पवित्र धार्मिक तीर्थस्थल र तातोपानी कुण्डको अनुपम संयोजन। स्थानीय होमस्टेलाई ग्रामीण आर्थिक सुधारको मेरुदण्ड बनाउने उद्देश्य।"}
                  </p>
                </div>

                {/* Attractions list display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MYAGDI_ATTRACTIONS.map((attr, aIdx) => (
                    <div 
                      key={aIdx} 
                      className={`bg-[#100C08] border border-[#D4A017]/10 hover:border-[#D4A017]/25 hover:bg-[#15100B] rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-3xl bg-[#080604] w-12 h-12 rounded-xl flex items-center justify-center border border-[#D4A017]/15">
                            {attr.emoji}
                          </span>
                          <span className="text-[10px] font-mono text-[#D4A017] font-bold group-hover:scale-105 transition-transform">
                            {language === "en" ? "GUIDE LIVE" : "मार्गनिर्देशन उपलब्ध"}
                          </span>
                        </div>

                        <h4 className="font-serif text-lg font-black text-white">{language === "en" ? attr.name : attr.npName}</h4>
                        <p className="text-xs text-[#9A8A6A] leading-relaxed mt-2">
                          {language === "en" ? attr.description : attr.npDescription}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-5 text-[10px] text-[#9A8A6A] flex justify-between items-center">
                        <span>{language === "en" ? "Myagdi District, Nepal" : "म्याग्दी जिल्ला, नेपाल"}</span>
                        <span className="text-[#F5C842] font-semibold">{language === "en" ? "Explore Map" : "नक्सा हेर्नुस्"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Local safety & guidelines block */}
                <div className="bg-[#100C08] border border-[#D4A017]/15 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-[#D4A017]" />
                    <h4 className="text-xs text-[#F5C842] uppercase font-serif font-black tracking-wider">
                      {language === "en" ? "Trekker Advisory" : "यात्री सुरक्षा संकलन"}
                    </h4>
                  </div>
                  <p className="text-xs text-[#9A8A6A] leading-relaxed">
                    {language === "en"
                      ? "Keep track of weather patterns before hiking near French Pass. Ensure you always coordinate with certified local guides listed inside BeniJobs Nepal to guarantee secure passage and proper local community income support."
                      : "धौलागिरी पर्वत फेरो वा अग्ला पहाडी पदमार्गहरू चल्नुअघि मौसमको गति बुझ्नुहोस्। सधैं बेनीजब्स नेपालमा सूचीकृत स्थानीय प्रमाणित गाइडहरूसँग मात्र यात्रा गर्नुहोस् जसले आपकी सुरक्षामध्ये केही पैसा सिधै पहाडका गरिब परिवारको हातमा पुगोस्।"}
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Corporate Subsidiaries Horizontal Infinite Ticker */}
      <footer className="h-10 bg-[#D4A017] text-[#080604] border-t border-[#F5C842]/30 flex items-center overflow-hidden relative z-20 font-sans select-none">
        <div className="ticker-animate flex whitespace-nowrap gap-12 text-[10.5px] font-black tracking-widest uppercase items-center">
          
          <span className="flex items-center gap-2"><span>BaniDash Delivery</span> <span className="text-[7px]">✦</span></span>
          <span>BeniJobs Nepal Board</span>
          <span className="flex items-center gap-2"><span>AI BeniDash live helper</span> <span className="text-[7px]">✦</span></span>
          <span>Gurukul Digital Hub</span>
          <span className="flex items-center gap-2"><span>BaniMove Commute (2028)</span> <span className="text-[7px]">✦</span></span>
          <span>Baniya Farms Ltd (2028)</span>
          <span className="flex items-center gap-2"><span>BeniTech Systems</span> <span className="text-[7px]">✦</span></span>
          <span>HK grandmother Foundation</span>
          <span className="flex items-center gap-2"><span>BeniStay Homestay Booking</span> <span className="text-[7px]">✦</span></span>
          <span>ConnectBeni Fiber Line</span>
          <span className="flex items-center gap-2"><span>BeniRiver Rafting Adventures</span> <span className="text-[7px]">✦</span></span>
          <span>Baniya Properties land trust</span>
          <span className="flex items-center gap-2"><span>Visit Myagdi Guide Portal</span> <span className="text-[7px]">✦</span></span>

          {/* Duplicated for smooth loop scrolling */}
          <span className="flex items-center gap-2"><span>BaniDash Delivery</span> <span className="text-[7px]">✦</span></span>
          <span>BeniJobs Nepal Board</span>
          <span className="flex items-center gap-2"><span>AI BeniDash live helper</span> <span className="text-[7px]">✦</span></span>
          <span>Gurukul Digital Hub</span>
          <span className="flex items-center gap-2"><span>BaniMove Commute (2028)</span> <span className="text-[7px]">✦</span></span>
          <span>Baniya Farms Ltd (2028)</span>
          <span className="flex items-center gap-2"><span>BeniTech Systems</span> <span className="text-[7px]">✦</span></span>
          <span>HK grandmother Foundation</span>
          <span className="flex items-center gap-2"><span>BeniStay Homestay Booking</span> <span className="text-[7px]">✦</span></span>
          <span>ConnectBeni Fiber Line</span>
          <span className="flex items-center gap-2"><span>BeniRiver Rafting Adventures</span> <span className="text-[7px]">✦</span></span>
          <span>Baniya Properties land trust</span>
          <span className="flex items-center gap-2"><span>Visit Myagdi Guide Portal</span> <span className="text-[7px]">✦</span></span>

        </div>
      </footer>

      {/* Floating Sparkles Quick Assist Button (Bottom-Right) */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-14 right-6 z-40 bg-gradient-to-br from-[#D4A017] to-amber-600 hover:from-[#F5C842] hover:to-amber-500 text-black font-extrabold w-12 h-12 rounded-full shadow-[0_4px_20px_rgba(212,160,23,0.35)] hover:scale-110 active:scale-90 flex items-center justify-center transition-all cursor-pointer animate-bounce duration-1000"
      >
        <Sparkles className="w-5 h-5 text-black" />
      </button>

      {/* Active AI Chat Modal Trigger */}
      <AiBeniDashModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        language={language}
      />

    </div>
  );
}
