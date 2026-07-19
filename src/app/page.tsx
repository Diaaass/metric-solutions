import Hero from '@/components/sections/Hero';
import HomeAbout from '@/components/sections/HomeAbout';
import ServicesPreview from '@/components/sections/ServicesPreview';
import Stats from '@/components/sections/Stats';
import MetalPrices from '@/components/sections/MetalPrices';

export default function Home() {
  return (
    <>
      <Hero />
      <HomeAbout />
      <ServicesPreview />
      <Stats />
      <MetalPrices />
    </>
  );
}
