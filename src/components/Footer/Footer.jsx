import { Link } from "react-router-dom";

export const NAV_LINKS = [
  { name: "Home",         route: "/",             icon: "🏠" },
  { name: "Donate Blood", route: "/donate_blood", icon: "🩸" },
//   { name: "Community",    route: "/community",    icon: "🤝" },
  { name: "About",        route: "/about",        icon: "ℹ️"  },
];

export const PROFILE_LINKS = [
  { icon: "👤", label: "My Profile",       route: "/my_profile"      },
  { icon: "📋", label: "Donation History", route: "/donation_history" },
  { icon: "📍", label: "My Location",      route: "/my_location"     },
//   { icon: "⚙️", label: "Settings",         route: "/settings"        },
];

const HOW_IT_WORKS = [
  { step: "01", text: "আপনার লোকেশনের ৫০ কিমির মধ্যে রক্তদাতা খুঁজে বের করুন" },
  { step: "02", text: "প্রয়োজনে রিকোয়েস্ট করুন, কাছের ডোনাররা সরাসরি দেখতে পাবেন" },
  { step: "03", text: "ডোনার ফোনে যোগাযোগ করে রক্ত দিতে রাজি হবেন" },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#2a0a0a] text-[#f3e3e1] font-['Crimson_Pro',_Georgia,_serif] overflow-hidden">
      {/* faint radius rings — echoes the 50km search concept */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#8B0000]/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full border border-[#8B0000]/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-40 w-40 rounded-full border border-[#8B0000]/30"
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-8 sm:px-10">
        {/* Top: brand + radius pitch + columns */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B0000] text-base shadow-[0_0_0_4px_rgba(139,0,0,0.18)]">
                🩸
              </span>
              <span className="text-xl font-semibold tracking-tight text-white">
                রক্তদান
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#f3e3e1]/70">
              আপনার অবস্থানের <span className="text-[#f3a9a2] font-medium">৫০ কিলোমিটারের</span> মধ্যে
              রক্তদাতা খুঁজে বের করুন, অথবা রক্তের জন্য রিকোয়েস্ট করুন — কাছের
              ডোনাররা সরাসরি আপনাকে কল করবেন।
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#f3e3e1]/45">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ডোনেট করার পর ৩ মাস তথ্য প্রাইভেট থাকে
            </p>
          </div>

          {/* Nav links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3a9a2]">
              নেভিগেশন
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.route}>
                  <Link
                    to={link.route}
                    className="group inline-flex items-center gap-2 text-sm text-[#f3e3e1]/75 transition-colors hover:text-white"
                  >
                    <span className="text-[15px] opacity-80 group-hover:opacity-100">
                      {link.icon}
                    </span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Profile links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3a9a2]">
              অ্যাকাউন্ট
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PROFILE_LINKS.map((link) => (
                <li key={link.route}>
                  <Link
                    to={link.route}
                    className="group inline-flex items-center gap-2 text-sm text-[#f3e3e1]/75 transition-colors hover:text-white"
                  >
                    <span className="text-[15px] opacity-80 group-hover:opacity-100">
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* How it works — encodes the actual flow, so numbering is earned here */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3a9a2]">
              যেভাবে কাজ করে
            </h3>
            <ol className="mt-4 space-y-3">
              {HOW_IT_WORKS.map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="mt-0.5 text-[11px] font-semibold text-[#8B0000] bg-[#f3e3e1] rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                    {item.step}
                  </span>
                  <span className="text-sm leading-relaxed text-[#f3e3e1]/70">
                    {item.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-[#8B0000]/40 to-transparent" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-[#f3e3e1]/45 sm:flex-row">
          <p>© {new Date().getFullYear()} রক্তদান। প্রতিটি ফোঁটা একটি জীবন বাঁচায়।</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B0000]" />
            আপনার তথ্য সবসময় আপনার নিয়ন্ত্রণে — কনফার্ম বা ডিলিট করলেই সিস্টেম থেকে মুছে যাবে
          </p>
        </div>
      </div>
    </footer>
  );
}