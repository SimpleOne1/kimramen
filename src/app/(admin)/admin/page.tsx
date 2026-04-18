export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Добро пожаловать в админ-панель Kimramen
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Категории</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">0</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Товары</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">0</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Заказы</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">0</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Клиенты</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">0</div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Рабочая область
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Дальше сюда подключим реальные данные и страницы управления.
        </p>
      </div>
    </div>
  );
}