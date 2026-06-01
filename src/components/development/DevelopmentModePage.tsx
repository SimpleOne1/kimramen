import Image from "next/image";

export type DevelopmentModeContent = {
  title?: string;
  message?: string;
};

export default function DevelopmentModePage({
  title,
  message,
}: DevelopmentModeContent) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEE9EA] px-4 py-10 text-slate-950">
      <section className="w-full max-w-4xl rounded-[36px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur md:p-14">

        <div className="mb-10 flex justify-center">
          <Image
            src="/images/neon-logo.png"
            alt="Kimramen"
            width={420}
            height={180}
            className="h-auto w-auto object-contain"
            priority
          />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
          {title || "Сайт скоро откроется"}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
          {message ||
            "Мы готовим онлайн-магазин Kimramen к запуску."}
        </p>

        <div className="mx-auto mt-10 flex max-w-xl items-center gap-4">
          <div className="h-px flex-1 bg-orange-200" />
          <span className="text-3xl">🍜</span>
          <div className="h-px flex-1 bg-orange-200" />
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-orange-100 bg-orange-50 px-8 py-6">
          <div className="text-lg font-bold text-orange-900">
            Сейчас сайт находится в режиме разработки.
          </div>

          <div className="mt-2 text-sm text-slate-600">
            Спасибо за понимание. Скоро будет вкусно ❤️
          </div>
        </div>
      </section>
    </main>
  );
}