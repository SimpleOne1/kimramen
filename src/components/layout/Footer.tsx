"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-black text-white pt-8 pb-6 max-h-[500px] overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* 3 колонки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* ЛЕВО: Контакты (чуть опущены) */}
          <div className="mt-4 flex flex-col gap-3">
            <h3 className="text-xl font-semibold">
              {t("footerFull.contactsTitle")}
            </h3>
            <p className="text-sm text-gray-300">
              {t("footerFull.supportService")}
            </p>

            <p className="text-lg font-semibold">+38 093 993 90 75</p>
            <p className="text-sm">kimramen@support.ua</p>

            <p className="mt-2 text-sm text-gray-300">
              {t("footerFull.workHours")} <br />
              {t("footerFull.workEveryDay")}
            </p>

            <div className="mt-3 flex gap-3">
              <a
                href="https://wa.me/380939939075"
                target="_blank"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/40 hover:bg-white/10 transition"
              >
                <Image
                  src="/images/icons/whatsapp.png"
                  alt="WhatsApp"
                  width={20}
                  height={20}
                />
              </a>
              <a
                href="https://t.me/kimramen"
                target="_blank"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/40 hover:bg-white/10 transition"
              >
                <Image
                  src="/images/icons/telegram.png"
                  alt="Telegram"
                  width={20}
                  height={20}
                />
              </a>
            </div>
          </div>

          {/* ЦЕНТР: Информация (тоже немного опущена) */}
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <h3 className="mb-2 text-xl font-semibold">
              {t("footerFull.infoTitle")}
            </h3>

            <Link href="/about" className="hover:text-gray-300">
              {t("footerFull.aboutCompany")}
            </Link>
            <Link href="/blog" className="hover:text-gray-300">
              {t("footerFull.blog")}
            </Link>
            <Link href="/exchange-return" className="hover:text-gray-300">
              {t("footerFull.exchangeReturn")}
            </Link>
            <Link href="/loyalty" className="hover:text-gray-300">
              {t("footerFull.loyaltyProgram")}
            </Link>
            <Link href="/privacy-policy" className="hover:text-gray-300">
              {t("footerFull.privacyPolicy")}
            </Link>
            <Link href="/public-offer" className="hover:text-gray-300">
              {t("footerFull.publicOffer")}
            </Link>
            <Link href="/terms-of-use" className="hover:text-gray-300">
              {t("footerFull.termsOfUse")}
            </Link>
          </div>

          {/* ПРАВО: Лого + соцсети + оплаты + копирайт */}
          <div className="flex flex-col items-start md:items-end text-left md:text-right gap-4">
            {/* логотип максимально прижат вверх своей колонки */}
            <div className="kr-neon-wrap">
              <Image
                src="/images/neon-logo.png"
                alt="KIMRAMEN logo neon"
                width={160}
                height={90}
                className="kr-neon-logo"
              />
            </div>

            {/* Следите за нами */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-sm font-semibold">
                {t("footerFull.followUs")}
              </p>
              <div className="flex gap-3">
                <Image
                  src="/images/icons/facebook5.png"
                  alt="Facebook"
                  width={40}
                  height={40}
                />
                <Image
                  src="/images/icons/instagram5.png"
                  alt="Instagram"
                  width={40}
                  height={40}
                />
              </div>
            </div>

            {/* Мы принимаем (пока скрыт, как у тебя) */}
            <div className="hidden mt-2 flex flex-col items-start md:items-end gap-2">
              <p className="text-sm font-semibold">
                {t("footerFull.weAccept")}
              </p>
              <div className="flex gap-4 opacity-90">
                <Image
                  src="/images/icons/applepay.svg"
                  alt="Apple Pay"
                  width={36}
                  height={36}
                />
                <Image
                  src="/images/icons/googlepay.svg"
                  alt="Google Pay"
                  width={36}
                  height={36}
                />
                <Image
                  src="/images/icons/visa.svg"
                  alt="Visa"
                  width={36}
                  height={36}
                />
              </div>
            </div>

            {/* КОПИРАЙТ — теперь в правом столбце */}
            <div className="mt-4 text-[12px] text-gray-500 leading-tight">
              © Интернет-магазин KIMRAMEN {new Date().getFullYear()}
              <br />
              {t("footerFull.allRightsReserved")}
              <br />
              <a
                href="https://kesovagency.com"
                className="mt-1 inline-block underline hover:text-white"
              >
                KESOVAGENCY
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}