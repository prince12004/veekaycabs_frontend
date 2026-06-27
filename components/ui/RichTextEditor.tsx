"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

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

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write content here...", minHeight = 300 }: Props) {
  const modules = useMemo(() => TOOLBAR_MODULES, []);

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
      <QuillEditor
        value={value}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
        theme="snow"
      />
    </div>
  );
}
