"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import KimErrorPage from "@/src/components/common/KimErrorPage";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Kimramen runtime error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <KimErrorPage
      title={t("errors.common.title")}
      description={t("errors.common.description")}
      buttonText={t("errors.common.retry")}
      onRetry={reset}
    />
  );
}
