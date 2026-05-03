"use client";

import ReviewsSection from "../ReviewSection";
import MobileDots from "./MobileDots";

export default function MobileReviews() {
  return (
    <section className="mt-8 px-1">
      <div className="rounded-[4px] bg-[#f0eeee] py-3">
        <ReviewsSection />
      </div>
      <MobileDots />
    </section>
  );
}
