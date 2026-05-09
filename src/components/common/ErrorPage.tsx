"use client";

import Image from "next/image";

type ErrorPageProps = {
  title: string;
  description: string;
  buttonText?: string;
  onRetry?: () => void;
};

export default function ErrorPage({
  title,
  description,
  buttonText,
  onRetry,
}: ErrorPageProps) {
  return (
    <section className="kim-error-page" aria-label={title}>
      <div className="kim-error-page__inner">
        <Image
          src="/images/panda404.png"
          alt="Panda error illustration"
          width={360}
          height={360}
          priority
          className="kim-error-page__image"
        />

        <h1 className="kim-error-page__title">{title}</h1>
        <p className="kim-error-page__description">{description}</p>

        {onRetry && buttonText ? (
          <button type="button" onClick={onRetry} className="kim-error-page__button">
            {buttonText}
          </button>
        ) : null}
      </div>
    </section>
  );
}
