import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";

export const mdxComponents: MDXComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-3xl font-black text-fg tracking-tighter mt-8 mb-4" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-2xl font-extrabold text-fg tracking-tight mt-8 mb-3 border-l-4 border-signal-yellow pl-3" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-lg font-bold text-fg mt-6 mb-2" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="text-fg text-[15px] leading-7 my-3" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="text-signal-yellow underline underline-offset-2 hover:text-signal-orange" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-6 my-3 text-fg" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-6 my-3 text-fg" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="my-1" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-4 border-signal-yellow pl-4 my-5 text-fg italic text-[16px] leading-7" {...props} />
  ),
  hr: () => <hr className="border-line my-8" />,
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code className="bg-bg-card text-signal-yellow px-1 py-0.5 text-[13px]" {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre className="bg-bg-card border border-line p-3 my-4 text-[13px] text-fg overflow-x-auto" {...props} />
  ),
};
