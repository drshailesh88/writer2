declare module "@citation-js/core" {
  export class Cite {
    constructor(data: unknown);
    format(
      type: "bibliography" | "citation",
      options?: {
        format?: "text" | "html";
        template?: string;
        lang?: string;
      }
    ): string;
  }

  export const plugins: {
    config: {
      get(plugin: string): {
        templates: {
          add(name: string, template: string): void;
        };
        locales: {
          add(name: string, locale: string): void;
        };
      };
    };
    add(plugin: string, options?: unknown): void;
  };

  export const version: string;
}

declare module "@citation-js/plugin-csl" {}
