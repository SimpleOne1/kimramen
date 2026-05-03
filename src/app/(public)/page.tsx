import MainBannerFullSlider from "@/src/components/home/VideoSlideSingle";
import HomeProductsModule from "@/src/components/home/homeProductsModule";
import CategoriesSection from "@/src/components/home/CategoriesSections";
import PromotionsCarousel from "@/src/components/home/PromotionsCarousel";
import ReviewsSection from "@/src/components/home/ReviewSection";
import TinyClimber from "@/src/components/home/TinyClimber";
import MobileHome from "@/src/components/home/mobile/MobileHome";

function DesktopHome() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 lg:px-6">
      <section className="mb-8">
        <TinyClimber />
      </section>

      <section className="mb-8">
        <MainBannerFullSlider />
      </section>

      <section className="mb-10">
        <HomeProductsModule />
      </section>

      <section className="mb-10">
        <CategoriesSection />
      </section>

      <section className="mb-10">
        <PromotionsCarousel />
      </section>

      <section className="mb-10">
        <ReviewsSection />
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopHome />
      </div>

      <div className="lg:hidden">
        <MobileHome />
      </div>
    </>
  );
}
