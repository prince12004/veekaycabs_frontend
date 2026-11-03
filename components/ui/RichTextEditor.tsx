"use client";

import { useMemo, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment, AutoImage, AutoLink, Autoformat, BlockQuote, Bold, ClassicEditor, Essentials,
  FileRepository, FontBackgroundColor, FontColor, FontFamily, FontSize, GeneralHtmlSupport, Heading,
  HorizontalLine, Image, ImageCaption, ImageInsert, ImageResize, ImageStyle, ImageToolbar, ImageUpload,
  Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties, Paragraph, PasteFromOffice,
  RemoveFormat, SourceEditing, Strikethrough, Subscript, Superscript, Table, TableCaption,
  TableCellProperties, TableColumnResize, TableProperties, TableToolbar, Underline,
  type Editor, type EditorConfig, type FileLoader, type UploadAdapter,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { adminApi, editorUploadApi } from "@/lib/api";

// Sends pasted, dropped or picked images to storage so the saved HTML holds a
// URL instead of a base64 blob. Word pastes arrive as base64 and go through this too.
class ServerUploadAdapter implements UploadAdapter {
  private controller = new AbortController();

  constructor(private loader: FileLoader) {}

  async upload() {
    const file = await this.loader.file;
    if (!file) throw new Error("No image selected");
    try {
      const { data } = await editorUploadApi.uploadImage(file, this.controller.signal, (loaded, total) => {
        this.loader.uploadTotal = total;
        this.loader.uploaded = loaded;
      });
      // Local disk storage returns a path on the API host; Cloudinary/S3 URLs pass through.
      return { default: new URL(data.url, adminApi.defaults.baseURL).href };
    } catch (e: any) {
      throw e?.response?.data?.message || "Image upload failed";
    }
  }

  abort() {
    this.controller.abort();
  }
}

function UploadAdapterPlugin(editor: Editor) {
  editor.plugins.get(FileRepository).createUploadAdapter = (loader) => new ServerUploadAdapter(loader);
}

const BORDER_COLORS = [
  { color: "#000000", label: "Black" }, { color: "#4A4A6A", label: "Slate" }, { color: "#9090A8", label: "Grey" },
  { color: "#E4E5EF", label: "Light grey" }, { color: "#E8540A", label: "Veekay orange" }, { color: "#FFFFFF", label: "White", hasBorder: true },
];

const CELL_COLORS = [
  { color: "#F8F9FC", label: "Off white", hasBorder: true }, { color: "#F1F2F7", label: "Light grey" }, { color: "#FFF3ED", label: "Light orange" },
  { color: "#FEF3C7", label: "Light yellow" }, { color: "#D1FAE5", label: "Light green" }, { color: "#DBEAFE", label: "Light blue" },
  { color: "#FEE2E2", label: "Light red" }, { color: "#E8540A", label: "Veekay orange" }, { color: "#0F0F1A", label: "Dark" },
];

const TOOLBAR_ITEMS = [
  "undo", "redo", "|", "heading", "|", "fontFamily", "fontSize", "fontColor", "fontBackgroundColor", "|",
  "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "removeFormat", "|",
  "alignment", "bulletedList", "numberedList", "outdent", "indent", "|",
  "link", "insertImage", "insertTable", "blockQuote", "horizontalLine", "|", "sourceEditing",
];

const EDITOR_CONFIG: EditorConfig = {
  licenseKey: "GPL",
  plugins: [
    Alignment, AutoImage, AutoLink, Autoformat, BlockQuote, Bold, Essentials, FontBackgroundColor, FontColor,
    FontFamily, FontSize, GeneralHtmlSupport, Heading, HorizontalLine, Image, ImageCaption, ImageInsert, ImageResize,
    ImageStyle, ImageToolbar, ImageUpload, Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties,
    Paragraph, PasteFromOffice, RemoveFormat, SourceEditing, Strikethrough, Subscript, Superscript, Table,
    TableCaption, TableCellProperties, TableColumnResize, TableProperties, TableToolbar, Underline,
  ],
  extraPlugins: [UploadAdapterPlugin],
  heading: {
    options: [
      { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
      { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
      { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
      { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
      { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
      { model: "heading5", view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
      { model: "heading6", view: "h6", title: "Heading 6", class: "ck-heading_heading6" },
    ],
  },
  fontFamily: { supportAllValues: true },
  fontSize: { options: [10, 12, 14, "default", 16, 18, 20, 24, 28, 32], supportAllValues: true },
  list: { properties: { styles: true, startIndex: true, reversed: true } },
  link: {
    addTargetToExternalLinks: false,
    decorators: { openInNewTab: { mode: "manual", label: "Open in a new tab", attributes: { target: "_blank", rel: "noopener noreferrer" } } },
  },
  image: {
    insert: { integrations: ["upload", "url"] },
    toolbar: ["imageTextAlternative", "toggleImageCaption", "|", "imageStyle:inline", "imageStyle:block", "imageStyle:side", "|", "linkImage"],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "|", "tableProperties", "tableCellProperties", "toggleTableCaption"],
    tableProperties: { borderColors: BORDER_COLORS, backgroundColors: CELL_COLORS },
    tableCellProperties: { borderColors: BORDER_COLORS, backgroundColors: CELL_COLORS },
  },
  // Keeps the inline styles, classes and attributes that older posts and Word or
  // Docs pastes carry, so opening and saving a page doesn't strip its formatting.
  // The server sanitizes again on save (see utils/sanitizeHtml.js on the API).
  htmlSupport: {
    allow: [{
      name: /^(p|div|span|h[1-6]|a|b|strong|i|em|u|s|strike|del|ins|sub|sup|small|big|mark|font|ul|ol|li|dl|dt|dd|table|caption|colgroup|col|thead|tbody|tfoot|tr|th|td|figure|figcaption|img|blockquote|pre|code|hr)$/,
      attributes: true,
      classes: true,
      styles: true,
    }],
    disallow: [{ attributes: [{ key: /^on/i, value: true }] }],
  },
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write content here...", minHeight = 300 }: Props) {
  const editorRef = useRef<Editor | null>(null);
  // Wider screens show every tool; on phones the extras collapse into a "more" menu.
  const config = useMemo<EditorConfig>(() => ({
    ...EDITOR_CONFIG,
    placeholder,
    toolbar: { items: TOOLBAR_ITEMS, shouldNotGroupWhenFull: window.innerWidth >= 768 },
  }), [placeholder]);

  // Source mode only feeds the editor's data when toggled off, so typed HTML
  // would be missed by a Save clicked straight away — leaving the box commits it.
  const commitSourceEdits = () => {
    const sourceEditing = editorRef.current?.plugins.get(SourceEditing);
    if (sourceEditing?.isSourceEditingMode) sourceEditing.updateEditorData();
  };

  return (
    <div className="rich-editor-wrap min-w-0" onBlurCapture={commitSourceEdits}>
      <style>{`
        .rich-editor-wrap .ck-editor__editable_inline, .rich-editor-wrap .ck-source-editing-area { min-height: ${minHeight}px; }
        .rich-editor-wrap .ck.ck-toolbar { background: #F8F9FC; border-color: #E4E5EF; }
        .rich-editor-wrap .ck.ck-editor__main > .ck-editor__editable { border-color: #E4E5EF; color: #0F0F1A; font-size: 14px; line-height: 1.7; }
        .rich-editor-wrap .ck.ck-editor__main > .ck-editor__editable.ck-focused { border-color: #E8540A; box-shadow: none; }
        .rich-editor-wrap .ck-content h1 { font-size: 2em; font-weight: 800; margin: 0.8em 0 0.4em; }
        .rich-editor-wrap .ck-content h2 { font-size: 1.5em; font-weight: 800; margin: 0.8em 0 0.4em; }
        .rich-editor-wrap .ck-content h3 { font-size: 1.25em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .rich-editor-wrap .ck-content h4 { font-size: 1.1em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .rich-editor-wrap .ck-content h5, .rich-editor-wrap .ck-content h6 { font-weight: 700; margin: 0.8em 0 0.4em; }
        .rich-editor-wrap .ck-content ul { list-style: disc; padding-left: 1.5em; }
        .rich-editor-wrap .ck-content ol { list-style: decimal; padding-left: 1.5em; }
        .rich-editor-wrap .ck-content a { color: #0B66C3; text-decoration: underline; }
        .rich-editor-wrap .ck-content blockquote { border-left: 4px solid #E4E5EF; padding-left: 1em; font-style: italic; }
        .rich-editor-wrap .ck-content table th { font-weight: 700; }
      `}</style>
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={value}
        onReady={(editor) => { editorRef.current = editor; }}
        onChange={(_, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
