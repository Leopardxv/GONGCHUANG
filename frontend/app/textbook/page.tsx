"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { exercisesForPage } from "@/data/exercises";
import { snippetsForPage } from "@/data/textbook-snippets";

interface Section {
  number: string;
  title: string;
  page: number;
  subsections?: Section[];
}

interface Chapter {
  chapter: number;
  title: string;
  page: number;
  sections: Section[];
}

/* ── Chevron icons ── */
function ChevronDown({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRight({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ── Interactive TOC item with local state ── */
function TocChapter({
  chapter,
  currentPage,
  onNavigate,
}: {
  chapter: Chapter;
  currentPage: number;
  onNavigate: (page: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({});
  const hasSubs = chapter.sections.some((s) => (s.subsections?.length ?? 0) > 0);

  const toggleSection = (num: string, page: number) => {
    if (chapter.sections.find((s) => s.number === num && (s.subsections?.length ?? 0) > 0)) {
      setSectionOpen((prev) => ({ ...prev, [num]: !prev[num] }));
    } else {
      onNavigate(page);
    }
  };

  return (
    <div>
      <button
        onClick={() => { setOpen(!open); onNavigate(chapter.page); }}
        className={`flex w-full items-center gap-1.5 py-2 pl-3 pr-2 text-left text-xs font-medium transition-colors ${
          currentPage >= chapter.page && currentPage < chapter.page + 100
            ? "text-[var(--color-text)]"
            : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
        }`}
      >
        <span className="shrink-0 text-[var(--color-subtle)]">{open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}</span>
        <span className="min-w-0 truncate">Ch{chapter.chapter}: {chapter.title}</span>
        <span className="ml-auto shrink-0 text-[10px] text-[var(--color-subtle)]">{chapter.page}</span>
      </button>
      {open && chapter.sections.map((sec) => (
        <div key={sec.number}>
          <button
            onClick={() => toggleSection(sec.number, sec.page)}
            className={`flex w-full items-center gap-1.5 py-1 pl-8 pr-2 text-left text-xs transition-colors ${
              currentPage === sec.page
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {hasSubs && (sec.subsections?.length ?? 0) > 0 ? (
              <span className="shrink-0 text-[var(--color-subtle)]">
                {sectionOpen[sec.number] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </span>
            ) : (
              <span className="w-2.5 shrink-0" />
            )}
            <span className="min-w-0 truncate">{sec.number} {sec.title}</span>
            <span className="ml-auto shrink-0 text-[10px] text-[var(--color-subtle)]">{sec.page}</span>
          </button>
          {sectionOpen[sec.number] && sec.subsections?.map((sub) => (
            <button
              key={sub.number}
              onClick={() => onNavigate(sub.page)}
              className={`flex w-full items-center gap-1.5 py-1 pl-14 pr-2 text-left text-xs transition-colors ${
                currentPage === sub.page
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <span className="w-2.5 shrink-0" />
              <span className="min-w-0 truncate">{sub.number} {sub.title}</span>
              <span className="ml-auto shrink-0 text-[10px] text-[var(--color-subtle)]">{sub.page}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── PDF Viewer ── */
function PDFViewer({
  page,
  debouncedPage,
  onNavigate,
  isInternalChange,
}: {
  page: number;
  debouncedPage: number;
  onNavigate: (page: number) => void;
  isInternalChange: boolean;
}) {
  const router = useRouter();
  const pdfUrl = "/ICT.pdf";
  const exercises = exercisesForPage(debouncedPage);
  const snippets = snippetsForPage(debouncedPage);

  // PDF page numbers are zero-indexed in the PDF spec
  // The book page numbers include front matter (xvii pages of roman numerals)
  // Page 1 of content = PDF page 18 (since there are ~17 roman numeral pages)
  // Actually, pages 1-10 = front matter, page 11 = TOC starts. Content page 1 = around PDF page 18
  const FRONT_MATTER_PAGES = 17;
  const pdfPage = page + FRONT_MATTER_PAGES;

  const [inputVal, setInputVal] = useState(page.toString());
  const iframeInitializedRef = useRef(false);

  // Sync input value with external page changes
  useEffect(() => {
    setInputVal(page.toString());
  }, [page]);

  // Sync iframe src with page changes ONLY ONCE on mount
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("#pdf-viewer");
    if (iframe && !iframeInitializedRef.current) {
      iframe.src = `/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfUrl)}#page=${pdfPage}`;
      iframeInitializedRef.current = true;
    }
  }, [pdfUrl, pdfPage]);

  // Navigate the PDF inside the iframe via postMessage without reloading
  useEffect(() => {
    if (iframeInitializedRef.current && !isInternalChange) {
      const iframe = document.querySelector<HTMLIFrameElement>("#pdf-viewer");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "set-pdf-page", page: pdfPage }, "*");
      }
    }
  }, [pdfPage, isInternalChange]);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputVal, 10);
    if (!isNaN(p) && p > 0) {
      onNavigate(p);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-[var(--color-panel-strong)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-muted)]">
            Operating System Basics and Practice
          </span>
          <span className="text-[var(--color-subtle)]">|</span>
          <span className="text-xs text-[var(--color-text)]">Page {page}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(page - 1)}
              disabled={page <= 1}
              className="rounded border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-muted)]"
            >
              上一页
            </button>
            <button
              onClick={() => onNavigate(page + 1)}
              className="rounded border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              下一页
            </button>
          </div>

          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              pattern="^[0-9]+$"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-12 rounded border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_80%,transparent)] px-2 py-1 text-center text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              className="rounded border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              跳转
            </button>
          </form>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <iframe
          id="pdf-viewer"
          className="h-full w-full border-0"
          title="ICT Textbook"
        />
        <aside className="hidden w-[360px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel-soft)] lg:flex lg:flex-col">
          <div className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">本页实践</p>
            <h2 className="mt-2 text-2xl font-semibold leading-8 text-[var(--color-text)]">教材练习直达 xterm</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              系统会根据当前教材页推荐可在 Playground 终端中完成的实验。
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {/* ── Exercises ── */}
            <div className="pt-4">
              {exercises.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[var(--color-border)] p-4">
                  <p className="text-sm text-[var(--color-text)]">当前页暂无可执行练习</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                    试试教材第 90、117、138、152、164、256 页，那里已经绑定了终端实验。
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="surface rounded-[24px] p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] text-[var(--color-muted)]">
                            Ch {exercise.chapter} · Page {exercise.textbookPage}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold leading-6 text-[var(--color-text)]">
                            {exercise.title}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--color-tint-border)] bg-[var(--color-tint-soft)] px-2.5 py-1 text-[10px] text-[var(--color-tint-strong)]">
                          {exercise.difficulty}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-[var(--color-muted)]">{exercise.objective}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {exercise.commands.slice(0, 5).map((command) => (
                          <span key={command} className="rounded-full border border-[var(--color-border)] px-2.5 py-1 font-mono text-[10px] text-[var(--color-subtle)]">
                            {command}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          router.push(`/playground?exercise=${exercise.id}`);
                        }}
                        className="mt-5 w-full rounded-full border border-[var(--color-tint-border)] bg-[var(--color-tint)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                      >
                        在 xterm 中开始练习
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Code Snippets ── */}
            <div className="mt-6 border-t border-[var(--color-border)] pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">代码示例</p>
              {snippets.length > 0 ? (
                <>
                  <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]">
                    当前页出现的代码片段，可直接在终端中运行体验。
                  </p>
                  <div className="mt-4 space-y-4">
                    {snippets.map((snippet) => (
                      <div key={snippet.id} className="surface rounded-[20px] p-4">
                        <p className="text-[10px] text-[var(--color-muted)]">
                          §{snippet.section} · P{snippet.page}
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-[var(--color-text)]">{snippet.title}</h4>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{snippet.description}</p>
                        <pre className="mt-3 overflow-x-auto rounded-lg bg-[#1a1a2e] p-3 font-mono text-[11px] leading-5 text-[#d7d7d7]">
                          {snippet.code}
                        </pre>
                        <button
                          onClick={() => {
                            router.push(`/playground?snippet=${snippet.id}`);
                          }}
                          className="mt-3 w-full rounded-full border border-[var(--color-accent)] bg-transparent px-4 py-2 text-xs font-medium text-[var(--color-accent)] transition-all hover:bg-[var(--color-accent)] hover:text-white"
                        >
                          在终端中运行此代码
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-3 rounded-[20px] border border-dashed border-[var(--color-border)] p-4 text-xs leading-5 text-[var(--color-muted)]">
                  继续翻页，当教材中出现 Linux 命令或代码时，这里会自动展示可运行示例。
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function TextbookPage() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();
  const [toc, setToc] = useState<Chapter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedPage, setDebouncedPage] = useState(1);
  const [tocOpen, setTocOpen] = useState(true);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get("page") ?? "1", 10);
    if (p > 1) {
      setCurrentPage(p);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPage(currentPage);
    }, 150); // Debounce sidebar updates by 150ms
    return () => clearTimeout(handler);
  }, [currentPage]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    fetch("/textbook-toc.json")
      .then((r) => r.json())
      .then(setToc)
      .catch(() => {});
  }, []);

  // Listen for page change messages from the PDF.js iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "pdf-page-change") {
        const newPage = e.data.page;
        if (typeof newPage === "number" && newPage > 0) {
          setCurrentPage((prev) => {
            if (prev === newPage) return prev;
            isInternalChangeRef.current = true; // Set to true for internal page change (scroll)
            return newPage;
          });
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function handleLogout() {
    await authService.logout();
    setUser(null);
    router.push("/");
  }

  function handleNavigate(page: number) {
    if (page > 0) {
      isInternalChangeRef.current = false; // Reset to false for parent navigation
      setCurrentPage(page);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      {/* Header */}
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-panel)] px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            Back
          </button>
          <span className="text-[var(--color-subtle)]">/</span>
          <span className="text-sm font-semibold text-[var(--color-text)]">数字教材</span>
          <span className="text-[var(--color-subtle)]">/</span>
          <span className="text-sm text-[var(--color-muted)]">Operating System Basics and Practice</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/playground")}
            className="rounded-full border border-[var(--color-accent)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition-all hover:bg-[var(--color-accent)] hover:text-white"
          >
            Playground 命令行
          </button>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text)]">
            {user?.username}
          </span>
          <button onClick={handleLogout} className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)]">
            Sign out
          </button>
        </div>
      </header>

      {/* Body: TOC sidebar + PDF */}
      <div className="flex flex-1 overflow-hidden">
        {/* TOC sidebar */}
        <div
          className={`shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] transition-all duration-200 overflow-hidden ${
            tocOpen ? "w-[280px]" : "w-0"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Contents</span>
              <button
                onClick={() => setTocOpen(false)}
                className="text-xs text-[var(--color-subtle)] hover:text-[var(--color-text)]"
              >
                Hide
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {toc.map((ch) => (
                <TocChapter
                  key={ch.chapter}
                  chapter={ch}
                  currentPage={currentPage}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TOC toggle when collapsed */}
        {!tocOpen && (
          <button
            onClick={() => setTocOpen(true)}
            className="absolute left-0 top-[56px] z-10 mt-2 rounded-r border border-l-0 border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-3 text-[var(--color-subtle)] transition-colors hover:text-[var(--color-text)]"
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* PDF Viewer */}
        <PDFViewer
          page={currentPage}
          debouncedPage={debouncedPage}
          onNavigate={handleNavigate}
          isInternalChange={isInternalChangeRef.current}
        />
      </div>
    </div>
  );
}
