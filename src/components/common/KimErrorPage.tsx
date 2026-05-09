"use client";

import Image from "next/image";
import Link from "next/link";

type KimErrorPageProps = {
  title: string;
  description: string;
  buttonText: string;
  onRetry?: () => void;
  href?: string;
};

export default function KimErrorPage({
  title,
  description,
  buttonText,
  onRetry,
  href = "/",
}: KimErrorPageProps) {
  return (
    <div className="kim-error-page">
      <div className="kim-error-page__card">
        <Image
          src="/images/panda404.png"
          alt="Kimramen error panda"
          width={380}
          height={380}
          priority
          className="kim-error-page__image"
        />

        <h1 className="kim-error-page__title">{title}</h1>
        <p className="kim-error-page__description">{description}</p>

        {onRetry ? (
          <button className="kim-error-page__button" type="button" onClick={onRetry}>
            {buttonText}
          </button>
        ) : (
          <Link className="kim-error-page__button" href={href}>
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}
