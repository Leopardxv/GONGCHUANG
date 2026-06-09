import json
import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

_index: dict | None = None
_keywords: list[dict] | None = None

# Chinese → English term mapping for Linux concepts
CN_TO_EN: dict[str, list[str]] = {
    # File system
    "文件系统": ["file system", "filesystem", "VFS", "ext4", "inode"],
    "虚拟文件系统": ["virtual file system", "VFS", "file system"],
    "目录": ["directory", "folder", "path"],
    "挂载": ["mount", "filesystem"],
    "权限": ["permission", "chmod", "access control"],
    # Process
    "进程": ["process", "pid", "fork", "exec"],
    "线程": ["thread", "multithreading"],
    "调度": ["scheduler", "scheduling", "CFS"],
    "信号": ["signal"],
    "管道": ["pipe", "IPC"],
    # Memory
    "内存": ["memory", "RAM", "virtual memory", "page"],
    "虚拟内存": ["virtual memory", "paging", "swap"],
    "缓存": ["cache", "buffer"],
    # Network
    "网络": ["network", "TCP", "IP", "socket"],
    "套接字": ["socket", "network"],
    "路由": ["routing", "route"],
    "防火墙": ["firewall", "iptables", "netfilter"],
    # Shell/Bash
    "命令": ["command", "shell", "bash", "terminal"],
    "脚本": ["script", "bash", "shell scripting"],
    "管道符": ["pipe", "redirection"],
    "重定向": ["redirection", "stdout", "stdin"],
    # System
    "内核": ["kernel", "system call"],
    "驱动": ["driver", "kernel module"],
    "系统调用": ["system call", "syscall"],
    "开机": ["boot", "bootloader", "GRUB"],
    "服务": ["service", "daemon", "systemd"],
    "日志": ["log", "rsyslog", "journald"],
    # Development
    "编译": ["compile", "gcc", "build"],
    "调试": ["debug", "gdb"],
    "容器": ["container", "Docker"],
    "虚拟化": ["virtualization", "VM", "KVM"],
    # Tools
    "编辑器": ["editor", "vim", "vi"],
    "包管理": ["package", "rpm", "dnf", "apt"],
    "ssh": ["SSH", "sshd", "remote"],
    # Embedded
    "嵌入式": ["embedded", "ARM", "cross-compile"],
    "树莓派": ["Raspberry Pi", "embedded"],
}


def _load_index() -> dict:
    global _index, _keywords
    if _index is not None:
        return _index

    base = Path(__file__).parent.parent.parent.parent / "prompts"

    try:
        with open(base / "textbook_index.json", encoding="utf-8") as f:
            _index = json.load(f)
        with open(base / "textbook_keywords.json", encoding="utf-8") as f:
            _keywords = json.load(f)
        logger.info("Textbook index loaded: %d chapters, %d keywords",
                    len(_index.get("chapters", {})), len(_keywords or []))
    except Exception:
        logger.exception("Failed to load textbook index")
        _index = {"chapters": {}, "sections": []}
        _keywords = []
    return _index


def search_textbook(query: str) -> list[dict]:
    """Search textbook for relevant sections matching the query.
    Returns a list of matching sections with relevance info.
    """
    idx = _load_index()

    query_lower = query.lower()

    # Extract English words (3+ chars) and multi-word phrases
    eng_words = set()
    eng_phrases = set()
    
    # Extract individual words
    raw_words = re.findall(r'[a-zA-Z]{3,}', query_lower)
    eng_words.update(raw_words)
    
    # Build 2-3 word phrases for better accuracy
    for i in range(len(raw_words) - 1):
        eng_phrases.add(raw_words[i] + " " + raw_words[i + 1])
    for i in range(len(raw_words) - 2):
        eng_phrases.add(raw_words[i] + " " + raw_words[i + 1] + " " + raw_words[i + 2])

    # Extract Chinese terms and map to English equivalents
    chinese_terms = set()
    for cn_term, en_list in CN_TO_EN.items():
        if cn_term in query_lower:
            chinese_terms.add(cn_term)
            for en_item in en_list:
                # Keep multi-word phrases intact
                if " " in en_item:
                    eng_phrases.add(en_item.lower())
                else:
                    eng_words.add(en_item.lower())

    # Also extract any English-looking acronyms like VFS, PID, etc.
    acronyms = set(re.findall(r'\b[A-Z]{2,6}\b', query))
    eng_words.update(a.lower() for a in acronyms)
    
    # Filter out overly common words that pollute search
    common_words = {"the", "and", "for", "with", "how", "does", "what", "about", 
                    "explain", "please", "system", "linux", "file", "filesystem"}
    eng_words = {w for w in eng_words if w not in common_words}

    # Skip very short or generic queries
    total_terms = eng_words | eng_phrases | chinese_terms
    if not total_terms:
        return []

    results: list[dict] = []

    # Search in sections
    for sec in idx.get("sections", []):
        text = sec.get("text", "").lower()
        title = sec.get("title", "").lower()
        combined = title + " " + text

        # Score: phrase matches get highest weight
        score = 0
        for phrase in eng_phrases:
            if phrase in combined:
                score += 10
        for w in eng_words:
            if w in title:
                score += 5
            elif w in text:
                score += 1

        # Also bonus for chapter title match
        ch_key = f"ch{sec['chapter']}"
        if ch_key in idx.get("chapters", {}):
            ch_title = idx["chapters"][ch_key]["title"].lower()
            for w in eng_words:
                if w in ch_title:
                    score += 2
            for phrase in eng_phrases:
                if phrase in ch_title:
                    score += 5

        if score > 0:
            excerpt = _extract_excerpt(combined, eng_words, sec.get("text", ""))

            results.append({
                "chapter": sec["chapter"],
                "chapter_title": sec["chapter_title"],
                "section": sec["number"],
                "title": sec["title"],
                "page": sec["page"],
                "score": score,
                "excerpt": excerpt,
            })

    # Also check chapter-level keyword index for additional matches
    for kw in _keywords or []:
        kw_lower = [k.lower() for k in kw.get("keywords", [])]
        for w in eng_words:
            if any(w in k or k in w for k in kw_lower):
                # Check if already in results
                exists = any(
                    r["chapter"] == kw["chapter"] and r["section"] == kw["section"]
                    for r in results
                )
                if not exists:
                    results.append({
                        "chapter": kw["chapter"],
                        "chapter_title": "",  # Will be filled from index
                        "section": kw["section"],
                        "title": kw["title"],
                        "page": kw["page"],
                        "score": 5,
                        "excerpt": "",
                    })
                break

    # Fill in chapter titles, sort by score descending
    chapters = idx.get("chapters", {})
    for r in results:
        ch_key = f"ch{r['chapter']}"
        if not r.get("chapter_title") and ch_key in chapters:
            r["chapter_title"] = chapters[ch_key].get("title", "")

    results.sort(key=lambda x: x["score"], reverse=True)

    # Deduplicate by section
    seen = set()
    unique = []
    for r in results:
        key = (r["chapter"], r["section"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return unique[:5]  # Top 5 matches


def _extract_excerpt(text_lower: str, query_words: set, original_text: str) -> str:
    """Extract the most relevant excerpt from the text around matching words."""
    if not original_text:
        return ""

    text = original_text
    text_l = text.lower()

    best_pos = -1
    best_score = 0

    # Slide a window of ~300 chars
    window = 400
    step = 100

    for start in range(0, len(text_l) - window, step):
        end = start + window
        snippet = text_l[start:end]
        score = sum(1 for w in query_words if w in snippet)
        if score > best_score:
            best_score = score
            best_pos = start

    if best_pos >= 0:
        excerpt = text[best_pos:best_pos + window].strip()
        if best_pos > 0:
            excerpt = "..." + excerpt
        if best_pos + window < len(text):
            excerpt = excerpt + "..."
        return excerpt[:600]

    return text[:400] + "..."


def get_textbook_context(query: str) -> str:
    """Get textbook context formatted for inclusion in AI prompt.
    Returns empty string if no matches found.
    """
    results = search_textbook(query)
    if not results:
        return ""

    lines = [
        "【本课程教材《Operating System Basics and Practice》相关章节】",
        "请在回答时，若涉及以下教材中的内容，请引用具体章节和页码：",
        "",
    ]
    for r in results:
        lines.append(
            f"• 第{r['chapter']}章「{r['chapter_title']}」"
            f" §{r['section']}「{r['title']}」(第{r['page']}页)"
        )
        if r.get("excerpt"):
            lines.append(f"  摘录: {r['excerpt'][:300]}")

    lines.append("")
    lines.append("请在回答结尾，以「📚 教材参考：」开头，列出相关章节引用。")

    return "\n".join(lines)
