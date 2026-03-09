// Sample a few unknown tools to see what text Jina returns
const tests = [
  ['Ruminate', 'https://tryruminate.com'],
  ['Webcrumbs', 'https://www.webcrumbs.org/frontend-ai'],
  ['Klyps', 'https://klyps.io'],
  ['Websiteroast', 'https://thewebsiteroast.com'],
  ['PaintPotion', 'https://paint-potion.com'],
];

for (const [name, url] of tests) {
  const base = url.replace(/\/$/, '');
  let text = null;

  for (const u of [base + '/pricing', base]) {
    const res = await fetch(`https://r.jina.ai/${u}`, { headers: { Accept: 'text/plain' } });
    if (res.ok) {
      const t = await res.text();
      if (t.length > 200) { text = t.slice(0, 2000); break; }
    }
  }

  console.log(`\n=== ${name} ===`);
  console.log(text ? text.slice(0, 600) : 'NO TEXT');
  console.log('---');
}
