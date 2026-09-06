export default function AppSkeleton({
  message = "Загружаем рабочее пространство",
  error = "",
  onRetry,
}) {
  return (
    <div className="appShell appSkeleton" aria-busy={!error}>
      <aside className="sidebar skeletonSidebar" aria-hidden="true">
        <div className="skeletonBrand"><span /><strong /></div>
        <div className="skeletonNav">
          <span /><span /><span /><span /><span />
        </div>
        <div className="skeletonProfile" />
      </aside>

      <main className="workspace">
        <header className="topbar skeletonTopbar">
          <div className="skeletonSearch" />
          <div className="skeletonTopAction" />
          <div className="skeletonTopAction" />
        </header>

        <div className="taskPage">
          <div className="skeletonHeader">
            <span />
            <p />
          </div>
          <section className="productivityPanel skeletonPanel" aria-label={message}>
            <div className="analyticsGrid">
              <div><strong /><span /></div>
              <div><strong /><span /></div>
              <div><strong /><span /></div>
              <div><strong /><span /></div>
            </div>
          </section>
          <div className="skeletonQuickAdd" />
          <div className="loadingList skeletonTaskRows">
            <span /><span /><span /><span />
          </div>

          <div className={error ? "loadingState hasError" : "loadingState"} role={error ? "alert" : "status"}>
            <strong>{error ? "Не удалось загрузить данные" : message}</strong>
            <p>
              {error || "Показываем каркас интерфейса, пока приложение получает сессию и задачи."}
            </p>
            {error && onRetry && <button onClick={onRetry}>Повторить</button>}
          </div>
        </div>
      </main>
    </div>
  );
}
