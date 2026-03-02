import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const postData = {
  editor: {
    username: 'petehuang',
    fullName: 'Pete Huang'
  },
  categorySlug: 'daily-ai-briefing',
  title: 'Kling AI 1.5: The Sora Killer is Actually Here',
  slug: 'kling-ai-1-5-review',
  excerpt: 'Kling AI just dropped version 1.5 and the physics are finally making sense. Here is why the video AI wars just got a lot more interesting.',
  content: `
    <h2>The Physics Fix We Needed</h2>
    <p>Remember when AI video characters looked like they were floating through a fever dream? Those days are (mostly) gone. Kling AI 1.5 just hit the scene, and it's doing things with lighting and physics that Sora only promised us in a series of highly curated trailers.</p>
    
    <h3>What's New in 1.5?</h3>
    <ul>
      <li><strong>Motion Consistency:</strong> Objects don't just "pop" in and out of existence anymore. If you're throwing a ball, the ball stays a ball. Revolutionary, I know.</li>
      <li><strong>1080p Native:</strong> Everything looks crisp. No more squinting to see if that was a dog or a sentient loaf of bread.</li>
      <li><strong>Lighting Fidelity:</strong> The way light interacts with surfaces—especially skin and water—is reaching uncanny valley levels of good.</li>
    </ul>

    <blockquote>"This is the first time AI video feels usable for B-roll without 100 hours of manual retouching."</blockquote>

    <h2>The "Sora" Problem</h2>
    <p>While OpenAI has been busy with "Secret Projects" and regulatory talks, Kling has been shipping. The best model is the one you can actually use, and right now, Kling is winning the accessibility war. You can sign up, buy some credits, and start rendering cinematic shots today.</p>

    <h3>The Bottom Line</h3>
    <p>If you're a content creator or filmmaker, you need to be testing Kling 1.5. It's not perfect—complex finger movements still look like a spaghetti accident—but it's the closest we've come to professional-grade AI video generation.</p>

    <p><strong>Signal Score: 9/10.</strong> Go build something cool.</p>
  `,
  tags: ['Video AI', 'Kling AI', 'Tech Trends'],
  cover_image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000&auto=format&fit=crop',
  is_featured: true
};

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Get Author ID
    const authorRes = await client.query('SELECT id FROM public.profiles WHERE display_name = $1 AND username = $2 LIMIT 1', [postData.editor.fullName, postData.editor.username]);
    if (authorRes.rows.length === 0) throw new Error(`Author not found: ${postData.editor.fullName} (@${postData.editor.username})`);
    const authorId = authorRes.rows[0].id;

    // Get Category ID
    const catRes = await client.query('SELECT id FROM public.blog_categories WHERE slug = $1 LIMIT 1', [postData.categorySlug]);
    if (catRes.rows.length === 0) throw new Error('Category not found');
    const catId = catRes.rows[0].id;

    // Insert Blog Post
    const query = `
      INSERT INTO public.blog_posts 
        (title, slug, excerpt, content, cover_image_url, author_id, category_id, tags, status, is_featured, published_at, reading_time_min)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, 'published', $9, now(), 4)
      ON CONFLICT (slug) DO UPDATE SET 
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        updated_at = now()
    `;

    await client.query(query, [
      postData.title,
      postData.slug,
      postData.excerpt,
      postData.content.trim(),
      postData.cover_image_url,
      authorId,
      catId,
      postData.tags,
      postData.is_featured
    ]);

    console.log(`Successfully published blog post by ${postData.editor.fullName} (@${postData.editor.username}): ${postData.title}`);
  } catch (err) {
    console.error('Error writing blog:', err.message);
  } finally {
    await client.end();
  }
}

main();
