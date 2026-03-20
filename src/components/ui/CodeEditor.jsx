import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState }            from "@codemirror/state";
import { oneDark }                from "@codemirror/theme-one-dark";
import { java }                   from "@codemirror/lang-java";
import { python }                 from "@codemirror/lang-python";
import { javascript }             from "@codemirror/lang-javascript";
import { sql }                    from "@codemirror/lang-sql";

const LANG_MAP = {
  java:       () => java(),
  python:     () => python(),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  sql:        () => sql(),
};

const PLACEHOLDER = {
  java:       "// Write your Java code here...",
  python:     "# Write your Python code here...",
  javascript: "// Write your JavaScript code here...",
  typescript: "// Write your TypeScript code here...",
  sql:        "-- Write your SQL query here...",
};

export const SUPPORTED_LANGUAGES = [
  { id: "java",       label: "Java"       },
  { id: "python",     label: "Python"     },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "sql",        label: "SQL"        },
];

export function CodeEditor({ language = "java", value = "", onChange, minHeight = 180, readOnly = false }) {
  const containerRef = useRef(null);
  const viewRef      = useRef(null);
  const onChangeRef  = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    viewRef.current?.destroy();
    viewRef.current = null;

    const lang = (LANG_MAP[language?.toLowerCase()] || LANG_MAP.java)();

    const sizeTheme = EditorView.theme({
      "&": {
        fontSize: "13px",
        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        minHeight: `${minHeight}px`,
      },
      ".cm-content":  { minHeight: `${minHeight}px`, padding: "8px 0" },
      ".cm-scroller": { overflow: "auto" },
      ".cm-gutters":  { minWidth: "40px" },
    });

    const state = EditorState.create({
      doc: value || PLACEHOLDER[language?.toLowerCase()] || "",
      extensions: [
        basicSetup,
        lang,
        oneDark,
        sizeTheme,
        EditorView.lineWrapping,
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });

    viewRef.current = new EditorView({ state, parent: containerRef.current });
    return () => { viewRef.current?.destroy(); viewRef.current = null; };
  }, [language, readOnly, minHeight]);

  // Sync value from outside without recreating
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const cur = view.state.doc.toString();
    if (cur !== value && value !== undefined) {
      view.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
    }
  }, [value]);

  return <div ref={containerRef} style={{ border: "1px solid #2a2a35", borderRadius: 8, overflow: "hidden" }} />;
}
