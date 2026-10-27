import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Problem from "@/components/sections/Problem";
import About from "@/components/sections/About";
import Clinic from "@/components/sections/Clinic";
import Features from "@/components/sections/Features";
import Orgs from "@/components/sections/Orgs";
import Privacy from "@/components/sections/Privacy";
import Tech from "@/components/sections/Tech";
import Audience from "@/components/sections/Audience";
import Join from "@/components/sections/Join";
import Team from "@/components/sections/Team";

export default function Home() {
  return (
    <>
      <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-foam focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Problem />
        <About />
        <Clinic />
        <Features />
        <Orgs />
        <Privacy />
        <Tech />
        <Audience />
        <Team />
        <Join />
      </main>
    </>
  );
}
