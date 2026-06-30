import { useState } from "react";
import { Link } from "react-router-dom";

// ── Copy: every block has an EN + BN pair, swapped by the toggle ────────────
const copy = {
  en: {
    eyebrow: "How it works",
    title: "Blood, found nearby — not somewhere",
    lede:
      "We connect people who need blood with donors inside a 50 km radius, so help is never more than a short drive away.",
    steps: [
      {
        n: "01",
        title: "Send a request",
        body:
          "Tell us your blood type and location. Your request becomes visible to verified donors within 50 km — nowhere further.",
      },
      {
        n: "02",
        title: "Donors reach out",
        body:
          "A nearby donor calls the number on your request. No middle layer, no waiting room — just a direct call.",
      },
      {
        n: "03",
        title: "Or search yourself",
        body:
          "Prefer to look first? Browse donors within your own 50 km radius and reach out on your terms.",
      },
    ],
    privacyEyebrow: "After you donate",
    privacyTitle: "Three months of quiet",
    privacyBody:
      "Once you donate, your contact details are hidden from search for three months. Your body needs to recover — your phone shouldn't keep ringing while it does.",
    privacyNote: "Confirmed or deleted requests are removed from our system immediately. No one calls you again.",
    radiusLabel: "Search radius",
    radiusValue: "50 km",
    youLabel: "You",
    donorsLabel: "Donors nearby",
    ctaTitle: "Ready when you are",
    ctaBody: "Request blood, become a donor, or just see who's nearby.",
    cta1: "Request blood",
    cta2: "Become a donor",
  },
  bn: {
    eyebrow: "যেভাবে কাজ করে",
    title: "রক্ত খুঁজুন আশেপাশেই — দূরে নয়",
    lede:
      "যাদের রক্ত প্রয়োজন তাদের সাথে আমরা ৫০ কিলোমিটারের মধ্যে থাকা ডোনারদের যুক্ত করি, যাতে সাহায্য সবসময় হাতের নাগালে থাকে।",
    steps: [
      {
        n: "০১",
        title: "রিকোয়েস্ট পাঠান",
        body:
          "আপনার ব্লাড গ্রুপ এবং লোকেশন জানান। আপনার রিকোয়েস্টটি আপনার ৫০ কিলোমিটারের মধ্যে থাকা ভেরিফাইড ডোনারদের কাছে দেখা যাবে — এর বাইরে নয়।",
      },
      {
        n: "০২",
        title: "ডোনাররা যোগাযোগ করবে",
        body:
          "আশেপাশের কোনো ডোনার আপনার দেওয়া নাম্বারে সরাসরি কল করবে। কোনো মধ্যস্থতা নেই, অপেক্ষা নেই — শুধু সরাসরি কল।",
      },
      {
        n: "০৩",
        title: "অথবা নিজেই খুঁজুন",
        body:
          "আগে নিজে দেখতে চান? আপনার ৫০ কিলোমিটারের মধ্যে থাকা ডোনারদের ব্রাউজ করুন এবং নিজের সুবিধামতো যোগাযোগ করুন।",
      },
    ],
    privacyEyebrow: "রক্তদানের পর",
    privacyTitle: "তিন মাসের নিরবতা",
    privacyBody:
      "রক্তদানের পর আপনার তথ্য তিন মাসের জন্য সার্চ থেকে লুকানো থাকবে। আপনার শরীরের বিশ্রাম দরকার — সেই সময়ে আপনার ফোন বেজেই চলবে, তা হতে পারে না।",
    privacyNote: "কনফার্ম বা ডিলিট করা রিকোয়েস্ট সাথে সাথেই আমাদের সিস্টেম থেকে মুছে ফেলা হয়। আপনাকে আর কেউ কল করবে না।",
    radiusLabel: "সার্চ রেডিয়াস",
    radiusValue: "৫০ কিমি",
    youLabel: "আপনি",
    donorsLabel: "আশেপাশের ডোনার",
    ctaTitle: "আপনি প্রস্তুত হলেই",
    ctaBody: "রক্তের জন্য রিকোয়েস্ট করুন, ডোনার হয়ে যান, অথবা আশেপাশে কে আছে দেখুন।",
    cta1: "রক্তের জন্য রিকোয়েস্ট করুন",
    cta2: "ডোনার হোন",
  },
};

// ── Radius visual — the signature element: you, pulsing, with donors at the 50km edge ──
function RadiusVisual({ t }) {
  const donors = [
    { x: 78, y: 22 },
    { x: 24, y: 18 },
    { x: 88, y: 62 },
    { x: 14, y: 70 },
    { x: 55, y: 92 },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label={`${t.radiusLabel}: ${t.radiusValue}`}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#E7E2D8" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#B91C2B" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.5">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="40s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="50" cy="50" r="30" fill="none" stroke="#E7E2D8" strokeWidth="0.4" />

        {donors.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r="2.6" fill="#C9A227" />
            <circle cx={d.x} cy={d.y} r="2.6" fill="none" stroke="#C9A227" strokeWidth="0.5" opacity="0.6">
              <animate attributeName="r" values="2.6;6;2.6" dur="2.8s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2.8s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        <circle cx="50" cy="50" r="4.5" fill="#B91C2B" />
        <circle cx="50" cy="50" r="4.5" fill="none" stroke="#B91C2B" strokeWidth="0.6" opacity="0.5">
          <animate attributeName="r" values="4.5;10;4.5" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>

      <span className="absolute left-1/2 top-[50%] -translate-x-1/2 translate-y-3 text-[10px] font-medium text-stone-500">
        {t.youLabel}
      </span>
      <span className="absolute right-1 top-2 text-[10px] font-medium text-stone-400">{t.radiusValue}</span>
    </div>
  );
}

const About = () => {
  const [lang, setLang] = useState("bn");
  const t = copy[lang];
  const isBn = lang === "bn";

  return (
    <div
      className="min-h-screen bg-[#FAF7F2] text-stone-900"
      style={{ fontFamily: isBn ? "'Tiro Bangla', 'Inter', sans-serif" : "'Inter', sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Tiro+Bangla&display=swap"
        rel="stylesheet"
      />

      {/* Language toggle */}
      <div className="sticky top-0 z-10 flex justify-end bg-[#FAF7F2]/90 backdrop-blur px-6 py-4 border-b border-stone-200/70 sm:px-12">
        <div className="inline-flex items-center rounded-full border border-stone-300 bg-white px-1 py-1 text-xs font-medium">
          <button
            onClick={() => setLang("en")}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              lang === "en" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-700"
            }`}
          >
            English
          </button>
          <span className="px-0.5 text-stone-300">/</span>
          
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 sm:px-12">
        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-16 md:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B91C2B]">{t.eyebrow}</p>
            <h1 className="mt-3 text-3xl sm:text-4xl md:text-[2.75rem] font-semibold leading-[1.15] text-stone-900">
              {t.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-stone-600 max-w-md">{t.lede}</p>
          </div>
          <RadiusVisual t={t} />
        </section>

        {/* Steps */}
        <section className="py-12 border-t border-stone-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {t.steps.map((s) => (
              <div key={s.n}>
                <span className="text-sm font-medium text-stone-300 tabular-nums">{s.n}</span>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy block — the gold accent does exactly one job: trust after donation */}
        <section className="py-12 border-t border-stone-200">
          <div className="rounded-2xl bg-white border border-stone-200 px-7 py-8 sm:px-10 sm:py-10">
            <div className="flex items-start gap-4">
              <span
                className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: "#C9A227" }}
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#C9A227" }}>
                  {t.privacyEyebrow}
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-stone-900">{t.privacyTitle}</h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-stone-600 max-w-2xl">{t.privacyBody}</p>
                <p className="mt-4 text-sm leading-relaxed text-stone-500 max-w-2xl border-t border-stone-100 pt-4">
                  {t.privacyNote}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 border-t border-stone-200 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900">{t.ctaTitle}</h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600">{t.ctaBody}</p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="w-full sm:w-auto rounded-full bg-[#B91C2B] px-7 py-3 text-sm font-semibold text-white hover:bg-[#9d1825] transition-colors">
              {t.cta1}
            </Link>
            <Link to="/" className="w-full sm:w-auto rounded-full border border-stone-300 px-7 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors">
              {t.cta2}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;