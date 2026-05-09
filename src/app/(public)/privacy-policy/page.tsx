"use client";

import { useTranslation } from "react-i18next";
import KimStaticPage from "@/src/components/common/KimStaticPage";

type PrivacySection = {
  title: string;
  text: string;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  const sections = asArray<PrivacySection>(
    t("pages.privacyPolicy.sections", { returnObjects: true })
  );

  return (
    <KimStaticPage
      title={t("pages.privacyPolicy.title")}
      breadcrumbTitle={t("pages.privacyPolicy.breadcrumb")}
    >
      <p>{t("pages.privacyPolicy.intro")}</p>

      {sections.map((section, index) => (
        <section className="kim-info-page__section" key={`${section.title}-${index}`}>
          <h2>
            {index + 1}. {section.title}
          </h2>
          <p>{section.text}</p>
        </section>
      ))}
    </KimStaticPage>
  );
}
