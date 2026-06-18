import Hero from '@/components/sections/Hero';
import ServicesPreview from '@/components/sections/ServicesPreview';
import Stats from '@/components/sections/Stats';
import MetalPrices from '@/components/sections/MetalPrices';
import CTA from '@/components/sections/CTA';

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <Stats />
      <MetalPrices />
      <CTA />
    </>
  );
}
