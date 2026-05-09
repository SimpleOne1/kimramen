"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type StaticInfoPageProps = {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
};

export default function StaticInfoPage({
  title,
  breadcrumbs,
  children,
}: StaticInfoPageProps) {
  const { t } = useTranslation();

  return (
    <section className="kim-static-page" aria-label={title}>
      <div className="kim-static-page__inner">
        <h1 className="kim-static-page__title">{title}</h1>

        <nav
          aria-label={t("infoPage.breadcrumbsLabel")}
          className="kim-static-page__breadcrumbs"
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span className="kim-static-page__breadcrumb-item" key={`${item.label}-${index}`}>
                {item.href && !isLast ? (
                  <Link href={item.href} className="kim-static-page__breadcrumb-link">
                    {item.label}
                  </Link>
                ) : (
                  <span className="kim-static-page__breadcrumb-current">{item.label}</span>
                )}

                {!isLast && <span className="kim-static-page__breadcrumb-separator">•</span>}
              </span>
            );
          })}
        </nav>

        <div className="kim-static-page__content">{children}</div>
      </div>
    </section>
  );
}
