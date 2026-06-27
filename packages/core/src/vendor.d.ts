declare module 'pdfjs-dist/build/pdf.mjs' {
  export * from 'pdfjs-dist/types/src/pdf.js';
}

declare module 'turndown' {
  interface Options {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: '`' | '~';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '__' | '**';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
  }

  class TurndownService {
    constructor(options?: Options);
    use(plugin: (service: TurndownService) => void): this;
    addRule(key: string, rule: { filter: unknown; replacement: unknown }): this;
    turndown(html: string): string;
  }

  export = TurndownService;
}

declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown';
  export function gfm(service: TurndownService): void;
  export function tables(service: TurndownService): void;
  export function strikethrough(service: TurndownService): void;
}
