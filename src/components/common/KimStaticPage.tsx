import Link from "next/link";

export type KimStaticPageProps = {
  title: string;
  breadcrumbTitle: string;
  children: React.ReactNode;
};

export default function KimStaticPage({
  title,
  breadcrumbTitle,
  children,
}: KimStaticPageProps) {
  return (
    <div className="kim-info-page">
      <div className="kim-info-page__inner">
        <h1 className="kim-info-page__title">{title}</h1>

        <nav className="kim-info-page__breadcrumbs" aria-label="Breadcrumbs">
          <Link href="/" className="kim-info-page__breadcrumb-link">
            Главная
          </Link>
          <span className="kim-info-page__breadcrumb-separator">•</span>
          <span>{breadcrumbTitle}</span>
        </nav>

        <div className="kim-info-page__content">{children}</div>
      </div>
    </div>
  );
}
