import KimStaticPage from "@/src/components/common/KimStaticPage";

export default function AboutPage() {
  return (
    <KimStaticPage title="О KIMRAMEN" breadcrumbTitle="О компании">
      <p>
        KIMRAMEN — интернет-магазин азиатских продуктов, лапши, соусов, снеков, напитков и товаров
        для домашней кухни в Кишиневе.
      </p>

      <section className="kim-info-page__section">
        <h2>Что мы продаем</h2>
        <p>
          В каталоге представлены продукты и товары корейской, японской, тайской, китайской и другой
          азиатской кухни: лапша, рис, соусы, специи, напитки, снеки, десерты и готовые решения.
        </p>
      </section>

      <section className="kim-info-page__section">
        <h2>Оплата и безопасность</h2>
        <p>
          Онлайн-оплата проходит через защищенные платежные страницы Paynet и maib. Мы принимаем
          Visa и Mastercard и не храним полные данные банковских карт на сайте.
        </p>
      </section>

      <section className="kim-info-page__section">
        <h2>Компания</h2>
        <p>KIMLAB GROUP S.R.L. IDNO: 1025600048253.</p>
        <p>Юридический адрес: Mun. Chisinau, str. Constantin Tanase 9, MD-2005.</p>
        <p>Физический адрес / адрес самовывоза: г. Кишинев, ул. Ботаническая 8.</p>
        <p>
          Поддержка клиентов доступна ежедневно с 09:00 до 22:00 по телефонам +38 093 993 90 75 и
          +373 620 87 272, а также через email kimramen@support.ua и Telegram @kimramen.
        </p>
      </section>
    </KimStaticPage>
  );
}
