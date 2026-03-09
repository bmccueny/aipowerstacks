const remaining = [
  ['Ruminate',           'https://tryruminate.com'],
  ['Jolt',              'https://app.usejolt.ai'],
  ['Travelrank',        'https://travelrank.me'],
  ['BirdbrainBio',      'https://birdbrain.bio'],
  ['Exnge',             'https://www.exnge.com'],
  ['Costdown',          'https://www.costdown.app'],
  ['Websiteroast',      'https://thewebsiteroast.com'],
  ['FilmFlow',          'https://meetfebin.com/apps/filmflow'],
  ['Impira',            'https://www.impira.com/mango/overview'],
  ['TaskraSpace',       'https://taskra.space'],
  ['CsworkflowCs',      'https://csworkflow.consciousstage.com'],
];

const PRICING_SIGNAL = /pricing|plan[s]?|subscri|billing/i;

for (const [name, url] of remaining) {
  const res = await fetch(`https://r.jina.ai/${url}`, { headers: { Accept: 'text/plain' } }).catch(() => null);
  const text = res?.ok ? (await res.text()).slice(0, 2000) : null;
  const len = text?.length ?? 0;
  const hasPricingWord = text ? PRICING_SIGNAL.test(text) : false;
  console.log(`${name}: len=${len} hasPricingWord=${hasPricingWord}`);
  if (text) console.log('  preview:', text.slice(0, 150).replace(/\n/g,' '));
  console.log();
}
