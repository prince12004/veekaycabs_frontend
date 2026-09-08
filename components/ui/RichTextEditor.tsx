"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { Code2, Table2 } from "lucide-react";
import "react-quill-new/dist/quill.snow.css";

// Quill must not render server-side (uses browser globals)
const QuillEditor = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => (
  <div className="h-[300px] border-[1.5px] border-[#E4E5EF] rounded-xl animate-pulse bg-[#F8F9FC]" />
)});

const TOOLBAR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "color", "background",
  "list", "bullet", "indent",
  "blockquote", "code-block",
  "link", "image",
];

const TABLE_TEMPLATE = `<table>
  <tr><th>Car Category</th><th>Hourly Rate (approx.)</th><th>Daily Rate (approx.)</th></tr>
  <tr><td>Hatchback (Swift, i20, Baleno)</td><td>₹99</td><td>₹999</td></tr>
  <tr><td>Sedan (Honda City, Verna)</td><td>₹129</td><td>₹1,499</td></tr>
  <tr><td>SUV (Creta, XUV700)</td><td>₹169</td><td>₹1,999</td></tr>
</table>`;

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write content here...", minHeight = 300 }: Props) {
  const modules = useMemo(() => TOOLBAR_MODULES, []);
  const [sourceMode, setSourceMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTableTemplate = () => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}\n${TABLE_TEMPLATE}\n${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      const pos = start + TABLE_TEMPLATE.length + 2;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="rich-editor-wrap">
      <style>{`
        .rich-editor-wrap .ql-container { min-height: ${minHeight}px; font-family: inherit; font-size: 14px; }
        .rich-editor-wrap .ql-editor { min-height: ${minHeight}px; line-height: 1.7; color: #0F0F1A; }
        .rich-editor-wrap .ql-editor.ql-blank::before { color: #9090A8; font-style: normal; }
        .rich-editor-wrap .ql-toolbar { border-radius: 12px 12px 0 0 !important; border-color: #E4E5EF !important; background: #F8F9FC; }
        .rich-editor-wrap .ql-container { border-radius: 0 0 12px 12px !important; border-color: #E4E5EF !important; }
        .rich-editor-wrap .ql-toolbar button:hover, .rich-editor-wrap .ql-toolbar button.ql-active { color: #E8540A !important; }
        .rich-editor-wrap .ql-toolbar .ql-stroke { stroke: currentColor; }
        .rich-editor-wrap .ql-toolbar .ql-fill { fill: currentColor; }
      `}</style>

      <div className="flex items-center justify-end gap-2 mb-2">
        {sourceMode && (
          <button
            type="button"
            onClick={insertTableTemplate}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A] transition-colors"
          >
            <Table2 size={13} /> Insert Table
          </button>
        )}
        <button
          type="button"
          onClick={() => setSourceMode((s) => !s)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${sourceMode ? "bg-[#FFF3ED] border-[#E8540A]/30 text-[#E8540A]" : "border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A]"}`}
        >
          <Code2 size={13} /> {sourceMode ? "Visual Editor" : "HTML Source"}
        </button>
      </div>

      {sourceMode ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          style={{ minHeight }}
          className="w-full rounded-xl border-[1.5px] border-[#E4E5EF] p-4 font-mono text-[13px] leading-relaxed text-[#0F0F1A] focus:outline-none focus:border-[#E8540A]"
        />
      ) : (
        <QuillEditor
          value={value}
          onChange={onChange}
          modules={modules}
          formats={FORMATS}
          placeholder={placeholder}
          theme="snow"
        />
      )}
    </div>
  );
}
