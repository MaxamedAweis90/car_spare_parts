export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto flex w-full max-w-10/12 flex-col gap-2 px-4 py-6 text-sm text-(--color-muted) sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="font-semibold text-(--color-text)">SomaParts</span>
        <span className="text-center sm:text-right">
          © {year} SomaParts. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

