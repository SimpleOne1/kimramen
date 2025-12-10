
// HomePage renders main landing blocks for Kimramen

import MainBannerSlider from "@/src/components/home/MainBannerSlider";
import HotDealsSection from "@/src/components/home/HotDealsSections";
import CategoriesSection from "@/src/components/home/CategoriesSections";
import MainBannerFullSlider from "@/src/components/home/VideoSlideSingle";

export default function HomePage() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 lg:px-6">
        <section className="mb-8">
          <MainBannerFullSlider />
        </section>

        <section className="mb-10">
          <HotDealsSection />
        </section>

        <section className="mb-10">
          <CategoriesSection />
        </section>
      </div>
    </div>
  );
}