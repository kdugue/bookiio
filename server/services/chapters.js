const SECTION_PATTERNS = [
  /^(chapter\s+\d+|chapter\s+[a-z]+)/i,
  /^(part\s+\d+|part\s+[a-z]+)\b/i,
  /^(introduction|foreword|forward|preface|conclusion|epilogue|prologue|appendix|references|notes|index)\b/i,
  /^(section\s+\d+)/i,
];

const PAGE_FOOTER_PATTERN = /^.+\s*-\s*\d+\s*$/;
const TOC_LINE_PATTERN = /^.+\.\s*\d+\s*$/;

export function detectChapters(text) {
  const lines = text.split("\n");

  const tocRange = findTOC(lines);
  if (tocRange) {
    const chapters = parseFromTOC(lines, tocRange);
    if (chapters.length >= 2) return chapters;
  }

  return parseFromHeadings(lines);
}

function findTOC(lines) {
  let tocStart = -1;
  let consecutiveTocLines = 0;

  for (let i = 0; i < Math.min(lines.length, 500); i++) {
    const line = lines[i].trim();
    if (TOC_LINE_PATTERN.test(line) && line.length > 5) {
      if (tocStart === -1) tocStart = i;
      consecutiveTocLines++;
    } else if (consecutiveTocLines > 0 && line === "") {
      // allow blank lines in TOC
    } else {
      if (consecutiveTocLines >= 4) {
        return { start: tocStart, end: i };
      }
      tocStart = -1;
      consecutiveTocLines = 0;
    }
  }

  if (consecutiveTocLines >= 4) {
    return { start: tocStart, end: tocStart + consecutiveTocLines };
  }
  return null;
}

function parseFromTOC(lines, tocRange) {
  const tocLines = lines.slice(tocRange.start, tocRange.end);
  const majorSections = [];

  const topLevel = tocLines
    .map((l) => l.trim())
    .filter((l) => TOC_LINE_PATTERN.test(l) && l.length > 5)
    .map((l) => {
      const match = l.match(/^(.+?)\.*\s*(\d+)\s*$/);
      if (!match) return null;
      return { title: match[1].replace(/\.+$/, "").trim(), page: parseInt(match[2]) };
    })
    .filter(Boolean);

  if (topLevel.length === 0) return [];

  const bodyStart = tocRange.end;
  const bodyText = lines.slice(bodyStart);

  for (const entry of topLevel) {
    const charOffset = findSectionStart(bodyText, entry.title);
    if (charOffset !== -1) {
      majorSections.push({
        title: entry.title,
        lineOffset: bodyStart + charOffset,
      });
    }
  }

  if (majorSections.length < 2) {
    return topLevel.map((entry, i) => ({
      id: `ch-${i}`,
      title: entry.title,
      startLine: 0,
      endLine: lines.length,
    }));
  }

  majorSections.sort((a, b) => a.lineOffset - b.lineOffset);

  return majorSections.map((sec, i) => ({
    id: `ch-${i}`,
    title: sec.title,
    startLine: sec.lineOffset,
    endLine: i < majorSections.length - 1 ? majorSections[i + 1].lineOffset : lines.length,
  }));
}

function findSectionStart(lines, title) {
  const normalized = title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  for (let i = 0; i < lines.length; i++) {
    const lineNorm = lines[i].toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (lineNorm === normalized || lineNorm.startsWith(normalized)) {
      return i;
    }
  }
  return -1;
}

function parseFromHeadings(lines) {
  const chapters = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length > 100) continue;

    for (const pattern of SECTION_PATTERNS) {
      if (pattern.test(line)) {
        const prev = lines[i - 1]?.trim() ?? "";
        const next = lines[i + 1]?.trim() ?? "";
        if (prev === "" || next === "") {
          chapters.push({
            id: `ch-${chapters.length}`,
            title: line,
            startLine: i,
            endLine: lines.length,
          });
        }
        break;
      }
    }
  }

  for (let i = 0; i < chapters.length - 1; i++) {
    chapters[i].endLine = chapters[i + 1].startLine;
  }

  return chapters;
}

export function getChapterText(text, chapter) {
  const lines = text.split("\n");
  return lines.slice(chapter.startLine, chapter.endLine).join("\n");
}
