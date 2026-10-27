// Copy adapted from manastej.com (captured Oct 2026), with English translations.
// Gaps are marked TODO.

export const nav = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#organizations", label: "For HR" },
  { href: "#privacy", label: "Privacy" },
  { href: "#technology", label: "Technology" },
  { href: "#audience", label: "Who It's For" },
  { href: "#team", label: "Team" },
];

export const contactEmail = "info@manastej.com";
export const contactPhone = "9903812807";
export const contactPhoneHref = "tel:+919903812807";

export const hero = {
  eyebrow: "Manastej — Where Science Meets the Soul",
  title: "The Next-Generation Mental Wellness & Therapy Ecosystem",
  sub: "AI-Powered Mental Health for Everyone",
  body: "A privacy-first ecosystem connecting individual wellbeing, professional therapy, and organizational insight.",
  quote: "Mental health is not a destination, but a process. Manastej gives you the compass.",
  tagline: "When no one else listens, we do.",
  pillars: ["Personal wellbeing", "Clinical context", "Human connection", "Workplace insight"],
  steps: ["Understand the person", "Reflect every day", "Connect to care", "Support healthier teams"],
};

export const problem = {
  label: "The Problem",
  title: "One crisis, three broken systems",
  body: "Over 1 billion people live with a mental health condition. The systems meant to help them don't talk to each other.",
  // Figures as published on manastej.com. TODO(source): add citations (e.g. WHO) before launch.
  stats: [
    { label: "People affected worldwide", value: "1 in 7", note: "of all people globally" },
    { label: "Lost to the economy yearly", value: "$1T", note: "in lost productivity" },
    { label: "Treated in low-income countries", value: "<10%", note: "receive any care at all" },
    { label: "Mental health workers per 100k", value: "13", note: "in high-income countries" },
  ],
  failuresLabel: "Three systemic failures holding the world back",
  failures: [
    { who: "Individuals", title: "Disconnected tools", body: "Meditation apps and mood trackers that never connect to real clinicians. People fall through the gap between self-help and professional care." },
    { who: "Therapists", title: "Drowning in admin", body: "Outdated practice software eats hours that should go to patients. Clinicians spend more time on paperwork than on healing." },
    { who: "Employers", title: "Spending blind", body: "Wellness perks see under 5% usage, while burnout quietly drives costly turnover. Organizations invest without signal of impact." },
  ],
};

export const about = {
  label: "01 / What is Manastej?",
  title: "AI-Powered Mental Health for Everyone",
  body: "Manastej (Sanskrit: Manas \u201cmind\u201d + Tej \u201cradiance\u201d) connects self-care, professional therapy, and workplace wellbeing in one person-centered experience.",
  audiences: [
    { k: "For Individuals", title: "Personal Mental Wellness Tracking", body: "Wellness tracking, supportive resources, and reflective growth in a non-judgmental space for everyday reflection." },
    { k: "For Therapists", title: "Clinical Dashboards & Diagnostic Aids", body: "Longitudinal context and AI-assisted workflows that enhance — not replace — professional expertise." },
    { k: "For Organizations", title: "Workplace Wellbeing & HR Analytics", body: "Aggregated, privacy-aware workforce insights for startups and enterprises exploring team wellbeing." },
  ],
  disclaimer: "Manastej is in active development. Features described represent the product vision, not a claim that every feature is live or clinically validated.",
};

export const features = {
  label: "02 / Core Features",
  title: "Core Features of the Manastej Platform",
  body: "Connected experiences for personal reflection, professional care, and organizational wellbeing.",
  items: [
    { tag: "01 / Track", title: "Daily Cognitive-Flow (MCF) Tracker", body: "Mood, energy, anxiety, sleep, and productivity check-ins that build a personal wellbeing picture over time.", note: "ERS and CSI are proposed indicators. Not a diagnosis." },
    { tag: "02 / Clinical", title: "Secure Tele-Health Therapy Infrastructure", body: "Encrypted video and voice sessions with session notes and an optional AI-assisted therapist sidebar.", note: "Encryption and AI features require clinical validation before launch." },
    { tag: "03 / Bio", title: "Contactless Stress Detection & Bio-Nudges", body: "Optional passive sensing on supported devices, paired with gentle breathing and grounding micro-resets.", note: "Stress detection is exploratory. Requires informed consent and validation." },
    { tag: "04 / Express", title: "Mind Canvas — Digital Projective Psychology", body: "Drawing and symbolic reflection activities including House-Tree-Person-inspired prompts.", note: "AI interpretations are exploratory, not validated assessments." },
    { tag: "05 / Connect", title: "A Friend When You Need One", body: "Peer-support service connecting people with trained listeners. When no one else listens, we will.", note: "Not an emergency service. Escalation to licensed professionals is planned." },
    { tag: "06 / Grow", title: "Character Story — Your Mental Journey, Gamified", body: "An opt-in digital persona that grows alongside your reflections and wellbeing journey.", note: "Themes are reflective concepts, not clinical scores." },
  ],
};

export const orgs = {
  label: "03 / Organizations",
  title: "HR Admin & Organizational Suite",
  subtitle: "The Wellbeing of Your Workforce",
  body: "A company is only as strong as the minds within it. Manastej brings mental wellness context to the boardroom — anonymously and responsibly.",
  items: [
    { tag: "01 / Team Pulse", title: "See the team pulse, not individuals", body: "Real-time aggregated view of team mood, energy, and productivity — without ever seeing individual data." },
    { tag: "02 / VUCA Dashboard", title: "Understand workplace pressure", body: "AI-powered analysis using the VUCA framework — Volatility, Uncertainty, Complexity, and Ambiguity." },
    { tag: "03 / Privacy Guardrails", title: "Privacy built into reporting", body: "Data shown only for groups of 5+, reducing the risk of identifying individuals." },
    { tag: "04 / Pulse Surveys", title: "Check in regularly", body: "Weekly Pulse checks and Quarterly Deep Dives for feedback at different levels of detail." },
  ],
};

export const privacy = {
  label: "04 / Privacy & Security",
  title: "Privacy is non-negotiable.",
  body: "Mental health data is deeply sensitive. Manastej puts privacy, transparency, and human oversight at the center.",
  items: [
    { title: "Data isolation", body: "Strict data isolation by role and purpose. Implementation requires security review." },
    { title: "Organizational anonymity", body: "Aggregated and anonymized before display. Groups smaller than five are suppressed." },
    { title: "Human-in-the-loop AI", body: "Every consequential AI recommendation requires human review. AI supports, never replaces judgment." },
    { title: "PII protection", body: "Automated PII checks detect accidental personal-information exposure in communications." },
  ],
};

export const tech = {
  label: "05 / Technology",
  title: "Science-led. Human-centered.",
  body: "AI workflows, real-time infrastructure, and privacy-aware data practices. Implementation details are proprietary.",
  items: [
    { title: "AI & Intelligence", body: "Agentic AI with multi-model orchestration" },
    { title: "Biometric Analysis", body: "Proposed contactless sensing; requires validation" },
    { title: "Real-Time Infrastructure", body: "Cloud-native, globally scalable" },
    { title: "Data Security", body: "Encryption and role-based access control" },
    { title: "Clinical Compliance", body: "Architecture aligned with healthcare data standards" },
  ],
};

export const audience = {
  label: "06 / Who It's For",
  title: "Built for people, wherever they are.",
  body: "Mental wellness has no borders. Manastej is designed for different life stages and care settings.",
  items: [
    { title: "Individuals", body: "Personal wellbeing tracking, mood insights, and reflective growth tools." },
    { title: "Therapists", body: "Clinical dashboards, longitudinal context, and AI-assisted workflows." },
    { title: "Organizations", body: "Aggregated, privacy-aware workforce wellbeing analytics." },
  ],
};

export const join = {
  label: "07 / Be Part of the Journey",
  title: "We're building it for the world.",
  body: "Manastej is in development. Be among the first to experience it as it moves toward launch.",
  cta: "Contact the team",
  closing: "The radiance of the mind.",
};

export const team = {
  label: "Our Team",
  title: "The people behind Manastej",
  members: [
    {
      name: "Daliya Chakraborty",
      role: "Founder & CEO",
      photo: "/team/daliya.webp",
      bio: "A geographer and educator by training, Daliya spent five years inside Indian institutions watching the same crisis play out in every room. Students, teachers, and professionals were quietly collapsing under pressure that no system was designed to catch. That pattern of invisible distress, lagging data, and blunt interventions became the problem she could not stop thinking about. She taught herself to build. Working across Python, Firebase, and Gemini AI, she architected Manastej's core systems herself, including the Cognitive Flow Tracker, the session billing engine, and the role-based clinical access layer. She understands the user because she has been the user, and she understands institutions because she has worked inside them. With no clinical credential and no institutional blind spot, Daliya saw the gap between reactive mental healthcare and the proactive infrastructure organisations actually need, precisely because she was never trained to accept the status quo. A Governor's Silver Medal NCC cadet who represented West Bengal at Republic Day, she brings the same mission-driven, structured rigour to every layer of Manastej. She is also the author of How I Built the Hiring Velocity Method, with a vision to make the world a better place where every mind matters.",
    },
    {
      name: "Haresh Sainaath",
      role: "Technical Lead",
      photo: "/team/haresh.webp",
      bio: "Haresh is a technology enthusiast specializing in AI/ML, mobile development, and full-stack engineering. As Technical Lead at Manastej, he brings experience across product design, UI flows, and application architecture for mental wellness technology. With internship experience in software engineering and machine learning, he is passionate about AI/ML, product craft, and creating real-world impact through forward-thinking solutions.",
    },
    {
      name: "Kunal Jaiswal",
      role: "Marketing & Ops",
      photo: "/team/kunal.webp",
      bio: "KJ is a technology enthusiast and emerging innovator specializing in cloud computing, DevOps, and AI-driven solutions. As the Founder and President of the Cloud Innovators Society, KJ has experience in organizing and hosting technology events, including TEDx and AIOUG initiatives, while contributing to marketing, strategic outreach, and industry collaborations. Passionate about innovation, leadership, and business growth, KJ aims to bridge technology and real-world impact through forward-thinking solutions.",
    },
  ],
};
