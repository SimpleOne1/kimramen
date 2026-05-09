"use client";

import { useTranslation } from "react-i18next";
import KimStaticPage from "@/src/components/common/KimStaticPage";

type OrderBlock = {
  title: string;
  paragraphs: string[];
};

type DeliveryRule = {
  text: string;
};

type PaymentMethod = {
  title: string;
  text?: string;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default function PaymentAndShippingPage() {
  const { t } = useTranslation();

  const orderBlocks = asArray<OrderBlock>(
    t("pages.paymentAndShipping.orderBlocks", { returnObjects: true })
  );

  const deliveryRules = asArray<DeliveryRule>(
    t("pages.paymentAndShipping.delivery.rules", { returnObjects: true })
  );

  const paymentMethods = asArray<PaymentMethod>(
    t("pages.paymentAndShipping.payment.methods", { returnObjects: true })
  );

  return (
    <KimStaticPage
      title={t("pages.paymentAndShipping.title")}
      breadcrumbTitle={t("pages.paymentAndShipping.breadcrumb")}
    >
      <section className="kim-info-page__section">
        <h2>{t("pages.paymentAndShipping.howToOrder")}</h2>

        {orderBlocks.map((block, index) => (
          <section className="kim-info-page__subsection" key={`${block.title}-${index}`}>
            <h3>
              {index + 1}. {block.title}
            </h3>
            {block.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={`${block.title}-${paragraphIndex}`}>{paragraph}</p>
            ))}
          </section>
        ))}
      </section>

      <section className="kim-info-page__section">
        <h2>{t("pages.paymentAndShipping.delivery.title")}</h2>
        <p>{t("pages.paymentAndShipping.delivery.p1")}</p>
        <p>{t("pages.paymentAndShipping.delivery.p2")}</p>
        <p>{t("pages.paymentAndShipping.delivery.p3")}</p>
        <p>{t("pages.paymentAndShipping.delivery.p4")}</p>
      </section>

      <section className="kim-info-page__section">
        <h2>{t("pages.paymentAndShipping.cost.title")}</h2>

        <div className="kim-info-page__map-placeholder">
          {t("pages.paymentAndShipping.cost.mapPlaceholder")}
        </div>

        <p className="kim-info-page__lead">
          {t("pages.paymentAndShipping.cost.lead")}
        </p>

        <ol className="kim-info-page__ordered-list">
          {deliveryRules.map((rule, index) => (
            <li key={`${rule.text}-${index}`}>{rule.text}</li>
          ))}
        </ol>

        <p className="kim-info-page__strong">
          {t("pages.paymentAndShipping.cost.prepaidOnly")}
        </p>
        <p>{t("pages.paymentAndShipping.cost.pickup")}</p>
        <p className="kim-info-page__strong">
          {t("pages.paymentAndShipping.cost.address")}
        </p>
        <p>{t("pages.paymentAndShipping.cost.workTime")}</p>
      </section>

      <section className="kim-info-page__section">
        <h2>{t("pages.paymentAndShipping.payment.title")}</h2>

        <ol className="kim-info-page__ordered-list kim-info-page__payment-list">
          {paymentMethods.map((method, index) => (
            <li key={`${method.title}-${index}`}>
              <strong>{method.title}</strong>
              {method.text ? <p>{method.text}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </KimStaticPage>
  );
}
