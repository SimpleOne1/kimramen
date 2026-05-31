import Image from "next/image";

export type DevelopmentModeContent = {
  title?: string;
  message?: string;
};

export default function DevelopmentModePage({ title, message }: DevelopmentModeContent) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEE9EA] px-4 py-10 text-slate-950">
      <section className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur md:p-12">
        <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-950 p-4 shadow-lg">
          <Image src="/images/logo.png" alt="Kimramen" width={88} height={88} className="h-auto w-auto object-contain" priority />
        </div>

        <p className="mb-3 text-xs font-black uppercase tracking-[0.34em] text-orange-500">Kimramen</p>
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title || "Сайт скоро откроется"}</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
          {message || "Мы готовим онлайн-магазин к запуску. Скоро здесь можно будет выбрать товары, оформить заказ и оплатить его онлайн."}
        </p>

        <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-semibold text-orange-900">
          Сейчас сайт находится в режиме разработки.
        </div>
      </section>
    </main>
  );
}
