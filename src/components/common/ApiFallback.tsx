"use client";

type ApiFallbackProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export default function ApiFallback({
  title = "Не удалось загрузить данные",
  message = "Проверьте соединение или попробуйте повторить запрос.",
  onRetry,
  retryLabel = "Повторить",
}: ApiFallbackProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-900 px-4 py-2 text-sm font-medium text-white"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
