"use client";

import { useTranslation } from "react-i18next";
import KimErrorPage from "@/src/components/common/KimErrorPage";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <KimErrorPage
      title={t("errors.notFound.title")}
      description={t("errors.notFound.description")}
      buttonText={t("errors.notFound.button")}
      href="/"
    />
  );
}
