import KimStaticPage from "@/src/components/common/KimStaticPage";

export default function ContactsPage() {
  return (
    <KimStaticPage title="Контакты" breadcrumbTitle="Контакты">
      <section className="kim-info-page__section">
        <h2>Служба поддержки</h2>
        <p>Телефон: +38 093 993 90 75</p>
        <p>Мобильный телефон: +373 620 87 272</p>
        <p>Email: kimramen@support.ua</p>
        <p>Telegram: @kimramen</p>
        <p>График работы поддержки: каждый день с 09:00 до 22:00.</p>
        <p>
          По вопросам заказа, оплаты, доставки, возврата товара или возврата денежных средств
          укажите номер заказа и контактный телефон, чтобы менеджер мог быстрее проверить обращение.
        </p>
      </section>

      <section className="kim-info-page__section">
        <h2>Адреса</h2>
        <p>Физический адрес / адрес самовывоза: г. Кишинев, ул. Ботаническая 8.</p>
        <p>Юридический адрес: Mun. Chisinau, str. Constantin Tanase 9, MD-2005.</p>
        <p>Самовывоз доступен после подтверждения заказа.</p>
      </section>

      <section className="kim-info-page__section">
        <h2>Юридические данные</h2>
        <p>KIMLAB GROUP S.R.L.</p>
        <p>IDNO: 1025600048253</p>
        <p>IBAN: MD26AG000000022517190853</p>
        <p>Юридический адрес: Mun. Chisinau, str. Constantin Tanase 9, MD-2005.</p>
      </section>
    </KimStaticPage>
  );
}
