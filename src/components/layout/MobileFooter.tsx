"use client";

import Image from "next/image";
import Link from "next/link";

export default function MobileFooter() {
  return (
    <footer className="lg:hidden mx-0 mt-8 rounded-t-[22px] border-4 border-[#0094ff] bg-black px-3 pb-8 pt-4 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[16px] text-white/55">Служба поддержки:</p>
          <p className="mt-1 text-[21px] leading-tight">Мы на связи</p>
          <p className="mt-3 text-[21px] leading-tight">Каждый день: 9:00 — 22:00</p>

          <div className="mt-4 flex gap-3">
            <a href="https://wa.me/380939939075" className="grid h-12 w-12 place-items-center rounded-xl border border-white/50">
              <Image src="/images/icons/whatsapp.png" alt="WhatsApp" width={28} height={28} />
            </a>
            <a href="https://t.me/kimramen" className="grid h-12 w-12 place-items-center rounded-xl border border-white/50">
              <Image src="/images/icons/telegram.png" alt="Telegram" width={28} height={28} />
            </a>
          </div>
        </div>

        <Image src="/images/neon-logo.png" alt="KIMRAMEN" width={125} height={80} className="mt-1 shrink-0" />
      </div>

      <div className="mt-3 text-[18px] leading-tight">
        <p>+38 093 993 90 75</p>
        <p>kimramen@support.ua</p>
      </div>

      <div className="mt-3 text-[14px] leading-snug text-white/80">
        <p>Адрес магазина</p>
        <p>ул.Ботаническая 8, город Кишинев</p>
        <p>+38 093 993 90 75</p>
      </div>

      <Link href="/contacts" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm">
        <Image src="/images/icons/map-pin.svg" alt="" width={18} height={18} />
        на карте
      </Link>

      <p className="mt-6 text-[20px] text-[#E56A54]">Следите за нами:</p>
      <div className="mt-2 flex gap-7">
        <Image src="/images/icons/facebook5.png" alt="Facebook" width={48} height={48} />
        <Image src="/images/icons/instagram5.png" alt="Instagram" width={48} height={48} />
      </div>

      <p className="mt-6 text-[20px] text-[#E56A54]">Мы принимаем:</p>
      <div className="mt-2 flex items-center gap-3 opacity-90 text-[18px]">
        <span>Pay</span><span>GPay</span><span>🔴🟡</span><span className="italic">VISA</span>
      </div>

      <p className="mt-5 text-[10px] text-white/80">© Интернет-магазин KIMRAMEN 2026 Все права защищены</p>
      <p className="mt-2 text-[14px] text-white/90">Created by <span className="font-bold underline">KESOVAGENCY↗</span></p>
    </footer>
  );
}
