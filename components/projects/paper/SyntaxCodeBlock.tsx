import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import ini from "highlight.js/lib/languages/ini";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("c", c);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);

type SupportedLanguage = "bash" | "c" | "ini" | "javascript" | "python";

interface SyntaxCodeBlockProps {
    code: string;
    language: SupportedLanguage;
    filename?: string;
}

export default function SyntaxCodeBlock({ code, language, filename }: SyntaxCodeBlockProps) {
    const highlighted = hljs.highlight(code.trim(), { language }).value;

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101318] shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 py-2.5">
                <div className="flex gap-1.5" aria-hidden="true">
                    <span className="size-2.5 rounded-full bg-[#e06c75]/70" />
                    <span className="size-2.5 rounded-full bg-[#e5c07b]/70" />
                    <span className="size-2.5 rounded-full bg-[#98c379]/70" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                    {filename ?? language}
                </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-[#abb2bf] sm:text-sm">
                <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
            </pre>
        </div>
    );
}
