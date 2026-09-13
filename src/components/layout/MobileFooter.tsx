"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname, localizePath } from "@/src/lib/i18n/locale";

export default function MobileFooter() {
  const { t } = useTranslation();
  const locale = getLocaleFromPathname(usePathname());
  return (
    <footer className="mx-auto mt-8 w-[calc(100%-16px)] rounded-[16px] bg-black px-4 pb-5 pt-4 text-white lg:hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] text-white/55">{t("footerFull.supportService")}:</p>
          <p className="mt-1 text-[15px] leading-tight">{t("footerFull.workHours")}</p>
          <p className="mt-2 text-[14px] leading-tight">{t("footerFull.workEveryDay")}</p>

          <div className="mt-3 flex gap-2">
            <a href="https://wa.me/380939939075" className="grid h-8 w-8 place-items-center rounded-lg border border-white/50">
              <Image src="/images/icons/whatsapp.png" alt="WhatsApp" width={18} height={18} />
            </a>
            <a href="https://t.me/kimramen" className="grid h-8 w-8 place-items-center rounded-lg border border-white/50">
              <Image src="/images/icons/telegram.png" alt="Telegram" width={18} height={18} />
            </a>
          </div>
        </div>

        <Image src="/images/neon-logo.png" alt="KIMRAMEN" width={86} height={56} className="mt-1 h-auto w-[86px] shrink-0" />
      </div>

      <div className="mt-2 text-[12px] leading-tight">
        <p>+38 093 993 90 75</p>
        <p>+373 620 87 272</p>
        <p>kimramen@support.ua</p>
      </div>

      <div className="mt-2 text-[10px] leading-snug text-white/80">
        <p>{t("footerFull.physicalAddress")}</p>
        <p>ул.Ботаническая 8, город Кишинев</p>
        <p>{t("footerFull.legalAddress")}: Mun. Chisinau, str. Constantin Tanase 9, MD-2005</p>
        <p>+38 093 993 90 75</p>
      </div>

      <Link href={localizePath(locale, "/contacts")} className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/40 px-2.5 py-1 text-[10px]">
        <Image src="/images/icons/map-pin.svg" alt="" width={12} height={12} />
        {t("footerFull.contacts")}
      </Link>

      <p className="mt-4 text-[12px] text-[#E56A54]">{t("footerFull.followUs")}</p>
      <div className="mt-1 flex gap-3">
        <Image src="/images/icons/facebook5.png" alt="Facebook" width={28} height={28} className="h-auto w-7" />
        <Image src="/images/icons/instagram5.png" alt="Instagram" width={28} height={28} className="h-auto w-7" />
      </div>

      <p className="mt-4 text-[12px] text-[#E56A54]">{t("footerFull.weAccept")}</p>
      <Image
        src="/images/icons/payment-methods-dark.png"
        alt="Mastercard, Visa, Paynet, MIA"
        width={190}
        height={42}
        className="mt-2 h-auto max-w-full"
      />

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-white/75">
        <Link href={localizePath(locale, "/payment-and-shipping")} className="underline-offset-4 hover:underline">{t("footerFull.paymentAndDelivery")}</Link>
        <Link href={localizePath(locale, "/exchange-return")} className="underline-offset-4 hover:underline">{t("footerFull.exchangeReturn")}</Link>
        <Link href={localizePath(locale, "/terms-of-use")} className="underline-offset-4 hover:underline">{t("footerFull.termsOfUse")}</Link>
        <Link href={localizePath(locale, "/privacy-policy")} className="underline-offset-4 hover:underline">{t("footerFull.privacyPolicy")}</Link>
      </div>

      <p className="mt-3 text-[8px] text-white/80">© Kimramen {new Date().getFullYear()} {t("footerFull.allRightsReserved")}</p>
      <p className="mt-1 text-[10px] text-white/90">Created by <span className="font-bold underline">KESOVAGENCY↗</span></p>
    </footer>
  );
}
