import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "./MdxComponents";

export function ArticleBody({ source }: { source: string }) {
  return (
    <article className="px-4 py-8 max-w-3xl mx-auto">
      <MDXRemote source={source} components={mdxComponents} />
    </article>
  );
}
