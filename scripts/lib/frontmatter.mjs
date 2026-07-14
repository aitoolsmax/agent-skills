export function parseFrontmatter(markdown, source = 'SKILL.md') {
  if (!markdown.startsWith('---\n')) throw new Error(`${source} must start with YAML frontmatter`);
  const end = markdown.indexOf('\n---\n', 4);
  if (end === -1) throw new Error(`${source} has unterminated YAML frontmatter`);
  const block = markdown.slice(4, end);
  const data = {};
  for (const line of block.split('\n')) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!match) throw new Error(`${source} has unsupported frontmatter line: ${line}`);
    data[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return { data, body: markdown.slice(end + 5) };
}
