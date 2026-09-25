import Link from "next/link";

export default function DocsNotFound() {
  return (
    <section className="mx-auto max-w-2xl py-20">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-accent/70">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold text-text">
        Page not found / 页面不存在
      </h1>
      <p className="mt-4 text-base leading-relaxed text-text-secondary/80">
        This documentation page may have moved. Choose a language to return to
        the documentation index.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/en/docs/introduction"
          className="text-sm font-medium text-accent hover:underline"
        >
          English docs
        </Link>
        <Link
          href="/zh/docs/introduction"
          className="text-sm font-medium text-accent hover:underline"
        >
          中文文档
        </Link>
      </div>
    </section>
  );
}
