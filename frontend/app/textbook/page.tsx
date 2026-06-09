"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";

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

/* ── TOC Section row ── */
function TocSection({
  section,
  depth,
  expanded,
  currentPage,
  onNavigate,
}: {
  section: Section;
  depth: number;
  expanded: Record<string, boolean>;
  currentPage: number;
  onNavigate: (page: number) => void;
}) {
  const hasSub = (section.subsections?.length ?? 0) > 0;
  const key = section.number;
  const open = expanded[key] ?? false;

  return (
    <div>
      <button
        onClick={() => {
          if (hasSub) {
            expanded[key] = !open;
            // Trigger re-render hack: use state from parent
            onNavigate(-1); // will be handled
          } else {
            onNavigate(section.page);
          }
        }}
        className={`flex w-full items-center gap-1.5 py-1 pl-${4 + depth * 3} pr-2 text-left text-xs transition-colors ${
          currentPage === section.page
            ? "text-[#00FF66]"
            : "text-[#8E918F] hover:text-[#E6E6E6]"
        }`}
      >
        {hasSub ? (
          <span className="shrink-0 text-[#484f58]">{open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}</span>
        ) : (
          <span className="w-2.5 shrink-0" />
        )}
        <span className="min-w-0 truncate">{section.number} {section.title}</span>
        <span className="ml-auto shrink-0 text-[10px] text-[#484f58]">{section.page}</span>
      </button>
      {hasSub && open && section.subsections?.map((sub) => (
        <TocSection
          key={sub.number}
          section={sub}
          depth={depth + 1}
          expanded={expanded}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

/* ── A more interactive TOC item using local state ── */
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
            ? "text-[#E6E6E6]"
            : "text-[#8E918F] hover:text-[#E6E6E6]"
        }`}
      >
        <span className="shrink-0 text-[#484f58]">{open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}</span>
        <span className="min-w-0 truncate">Ch{chapter.chapter}: {chapter.title}</span>
        <span className="ml-auto shrink-0 text-[10px] text-[#484f58]">{chapter.page}</span>
      </button>
      {open && chapter.sections.map((sec) => (
        <div key={sec.number}>
          <button
            onClick={() => toggleSection(sec.number, sec.page)}
            className={`flex w-full items-center gap-1.5 py-1 pl-8 pr-2 text-left text-xs transition-colors ${
              currentPage === sec.page
                ? "text-[#00FF66]"
                : "text-[#8E918F] hover:text-[#E6E6E6]"
            }`}
          >
            {hasSubs && (sec.subsections?.length ?? 0) > 0 ? (
              <span className="shrink-0 text-[#484f58]">
                {sectionOpen[sec.number] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </span>
            ) : (
              <span className="w-2.5 shrink-0" />
            )}
            <span className="min-w-0 truncate">{sec.number} {sec.title}</span>
            <span className="ml-auto shrink-0 text-[10px] text-[#484f58]">{sec.page}</span>
          </button>
          {sectionOpen[sec.number] && sec.subsections?.map((sub) => (
            <button
              key={sub.number}
              onClick={() => onNavigate(sub.page)}
              className={`flex w-full items-center gap-1.5 py-1 pl-14 pr-2 text-left text-xs transition-colors ${
                currentPage === sub.page
                  ? "text-[#00FF66]"
                  : "text-[#8E918F] hover:text-[#E6E6E6]"
              }`}
            >
              <span className="w-2.5 shrink-0" />
              <span className="min-w-0 truncate">{sub.number} {sub.title}</span>
              <span className="ml-auto shrink-0 text-[10px] text-[#484f58]">{sub.page}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── PDF Viewer ── */
function PDFViewer({ page, toc }: { page: number; toc: Chapter[] }) {
  const pdfUrl = "/ICT.pdf";
  // PDF.js style: append #page=N to URL for navigation
  const iframeRef = useState<HTMLIFrameElement | null>(null)[1];

  // PDF page numbers are zero-indexed in the PDF spec
  // The book page numbers include front matter (xvii pages of roman numerals)
  // Page 1 of content = PDF page 18 (since there are ~17 roman numeral pages)
  // Actually, pages 1-10 = front matter, page 11 = TOC starts. Content page 1 = around PDF page 18
  const FRONT_MATTER_PAGES = 17;
  const pdfPage = page + FRONT_MATTER_PAGES;

  return (
    <div className="flex h-full flex-1 flex-col bg-[#1a1a1a]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#2D2D2D] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8E918F]">
            Operating System Basics and Practice
          </span>
          <span className="text-[#484f58]">|</span>
          <span className="text-xs text-[#E6E6E6]">Page {page}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const iframe = document.querySelector<HTMLIFrameElement>("#pdf-viewer");
              if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ type: "navigate", page: pdfPage }, "*");
              }
              // Fallback: reload with hash
              const el = document.querySelector<HTMLIFrameElement>("#pdf-viewer");
              if (el) el.src = `${pdfUrl}#page=${pdfPage}`;
            }}
            className="rounded border border-[#2D2D2D] px-2 py-0.5 text-xs text-[#8E918F] hover:border-[#00FF66] hover:text-[#00FF66]"
          >
            Go to page
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          id="pdf-viewer"
          src={`${pdfUrl}#page=${pdfPage}`}
          className="h-full w-full border-0"
          title="ICT Textbook"
        />
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
  const [tocOpen, setTocOpen] = useState(true);

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

  async function handleLogout() {
    await authService.logout();
    setUser(null);
    router.push("/");
  }

  function handleNavigate(page: number) {
    if (page > 0) {
      setCurrentPage(page);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2D2D2D] border-t-[#00FF66]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen flex-col bg-[#121212]">
      {/* Header */}
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[#2D2D2D] bg-[#161b22] px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#8b949e] transition-colors hover:text-[#58a6ff]"
          >
            Back
          </button>
          <span className="text-[#484f58]">/</span>
          <span className="text-sm font-semibold text-[#c9d1d9]">数字教材</span>
          <span className="text-[#484f58]">/</span>
          <span className="text-sm text-[#8b949e]">Operating System Basics and Practice</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[#30363d] bg-[#21262d] px-3 py-1 text-xs text-[#c9d1d9]">
            {user?.username}
          </span>
          <button onClick={handleLogout} className="text-xs text-[#8b949e] transition-colors hover:text-[#f85149]">
            Sign out
          </button>
        </div>
      </header>

      {/* Body: TOC sidebar + PDF */}
      <div className="flex flex-1 overflow-hidden">
        {/* TOC sidebar */}
        <div
          className={`shrink-0 border-r border-[#2D2D2D] bg-[#0d1117] transition-all duration-200 overflow-hidden ${
            tocOpen ? "w-[280px]" : "w-0"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[#2D2D2D] px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8b949e]">Contents</span>
              <button
                onClick={() => setTocOpen(false)}
                className="text-xs text-[#484f58] hover:text-[#c9d1d9]"
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
            className="absolute left-0 top-[56px] z-10 mt-2 rounded-r border border-l-0 border-[#2D2D2D] bg-[#0d1117] px-1.5 py-3 text-[#484f58] transition-colors hover:text-[#c9d1d9]"
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* PDF Viewer */}
        <PDFViewer page={currentPage} toc={toc} />
      </div>
    </div>
  );
}
