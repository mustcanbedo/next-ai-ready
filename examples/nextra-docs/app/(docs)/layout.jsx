import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";

const navbar = <Navbar logo={<b>Nextra + next-ai-ready</b>} />;
const footer = <Footer>Executable compatibility fixture.</Footer>;

export default async function DocsLayout({ children }) {
  return (
    <Layout
      navbar={navbar}
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/mustcanbedo/next-ai-ready/tree/main/examples/nextra-docs"
      footer={footer}
    >
      {children}
    </Layout>
  );
}
