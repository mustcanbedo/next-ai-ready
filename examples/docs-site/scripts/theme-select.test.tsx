import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createElement,
  useSyncExternalStore,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsThemeProvider } from "../app/[locale]/components/theme-provider";
import { ThemeSelect } from "../app/[locale]/components/theme-select";

const { provider, useTheme, setTheme } = vi.hoisted(() => ({
  provider: vi.fn(),
  useTheme: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock("next-themes", () => ({ ThemeProvider: provider, useTheme }));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return { ...react, useSyncExternalStore: vi.fn(react.useSyncExternalStore) };
});

beforeEach(async () => {
  const react = await vi.importActual<typeof import("react")>("react");
  vi.mocked(useSyncExternalStore).mockReset().mockImplementation(react.useSyncExternalStore);
  provider.mockReset().mockImplementation(({ children }: { children: ReactNode }) => children);
  useTheme.mockReset().mockReturnValue({ theme: undefined, setTheme });
  setTheme.mockReset();
});

function render(locale: "en" | "zh" = "en") {
  return renderToStaticMarkup(createElement(ThemeSelect, { locale }));
}

function mount() {
  vi.mocked(useSyncExternalStore).mockImplementation((_subscribe, getSnapshot) => getSnapshot());
}

describe("documentation theme selection", () => {
  it.each([undefined, "light", "dark", "system"])("renders the same disabled System control on the server for %s", (theme) => {
    const serverHtml = render();
    useTheme.mockReturnValue({ theme, setTheme });
    const html = render();

    expect(html).toBe(serverHtml);
    expect(html).toContain('<label class="theme-control" title="Appearance">');
    expect(html).toMatch(/<select[^>]*aria-label="Appearance"[^>]*disabled=""/);
    expect(html).toContain('<option value="system" selected="">System</option>');
    expect(html).toContain("lucide-monitor");
    expect(html).toContain('aria-hidden="true"');
    expect(setTheme).not.toHaveBeenCalled();
  });

  it("uses the server snapshot for initial hydration and a stable no-op subscription", () => {
    render();
    const [subscribe, getSnapshot, getServerSnapshot] = vi.mocked(useSyncExternalStore).mock.calls[0];
    const notify = vi.fn();

    expect(getSnapshot()).toBe(true);
    expect(getServerSnapshot?.()).toBe(false);
    const unsubscribe = subscribe(notify);
    expect(unsubscribe).toBeTypeOf("function");
    unsubscribe();
    expect(notify).not.toHaveBeenCalled();
    render();
    expect(vi.mocked(useSyncExternalStore).mock.calls[1]).toEqual([subscribe, getSnapshot, getServerSnapshot]);
  });

  it.each([
    ["light", "sun"],
    ["dark", "moon"],
    ["system", "monitor"],
  ])("shows the mounted %s preference and its %s icon", (theme, icon) => {
    mount();
    useTheme.mockReturnValue({ theme, resolvedTheme: "dark", setTheme });
    const html = render();

    expect(html).toContain(`<option value="${theme}" selected="">`);
    expect(html).toContain(`lucide-${icon}`);
    expect(html).not.toContain("disabled");
    expect(html).not.toContain("tabindex");
    expect(html).not.toContain('role="button"');
  });

  it("localizes the accessible name, hover title and native options", () => {
    const html = render("zh");
    expect(html).toContain('title="外观"');
    expect(html).toContain('aria-label="外观"');
    expect(html).toContain('<option value="light">浅色</option>');
    expect(html).toContain('<option value="dark">深色</option>');
    expect(html).toContain('<option value="system" selected="">跟随系统</option>');
  });

  it.each(["light", "dark", "system"])("passes the native %s selection to next-themes", (theme) => {
    mount();
    const control = ThemeSelect({ locale: "en" });
    const select = control.props.children[1] as ReactElement<SelectHTMLAttributes<HTMLSelectElement>>;

    expect(select.type).toBe("select");
    select.props.onChange?.({ target: { value: theme } } as ChangeEvent<HTMLSelectElement>);
    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith(theme);
  });

  it("passes server children unchanged with the required provider configuration", () => {
    const children = createElement("main", null, "Server content");
    const html = renderToStaticMarkup(createElement(DocsThemeProvider, { children }));

    expect(html).toBe("<main>Server content</main>");
    expect(provider.mock.calls[0][0]).toEqual({
      attribute: "data-theme",
      defaultTheme: "system",
      storageKey: "next-ai-ready-theme",
      enableSystem: true,
      disableTransitionOnChange: true,
      children,
    });
    expect(provider.mock.calls[0][0].children).toBe(children);
  });
});
