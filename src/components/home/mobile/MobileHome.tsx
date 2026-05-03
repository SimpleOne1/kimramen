import MobileHero from "./MobileHero";
import MobileProductsSection from "./MobileProductsSection";
import MobileCategories from "./MobileCategories";
import MobilePromotions from "./MobilePromotions";
import MobileReviews from "./MobileReviews";

export default function MobileHome() {
  return (
    <div className="bg-white pb-6">
      <MobileHero />
      <MobileProductsSection />
      <MobileCategories />
      <MobilePromotions />
      <MobileReviews />
    </div>
  );
}
