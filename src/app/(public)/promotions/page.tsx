import Image from "next/image";
import Link from "next/link";

const ACTION_IMAGES = [
  "/images/actions2/action1.png",
  "/images/actions2/action2.png",
  "/images/actions2/action3.png",
  "/images/actions2/action4.png",
  "/images/actions2/action5.png",
  "/images/actions2/action6.png",
];

export default function PromotionsPage() {
  return (
    <main className="min-h-screen bg-[#ece8e7] px-4 py-10 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500">
            <Link href="/" className="text-gray-900 hover:underline">
              Главная
            </Link>
            <span>•</span>
            <span>Акции</span>
          </div>

          <h1 className="text-4xl font-black uppercase tracking-[-0.04em] text-gray-950 md:text-6xl">
            Акции
          </h1>
          <p className="mt-4 max-w-2xl text-base text-gray-600 md:text-lg">
            Актуальные предложения Kimramen. Здесь собраны все промо-баннеры и специальные предложения магазина.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACTION_IMAGES.map((src, index) => (
            <article
              key={src}
              className="group overflow-hidden rounded-[26px] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <Image
                  src={src}
                  alt={`Акция Kimramen ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
