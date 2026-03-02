import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const personas = [
  {
    name: 'Rowan Cheung',
    bio: 'Founder of The Rundown AI. Specializing in rapid-fire, high-impact AI news and tool discoveries. My mission is to keep you ahead of the curve in the fastest-moving industry on Earth.',
    style: 'Speed-focused, tool-centric, daily updates, visual-heavy.'
  },
  {
    name: 'Pete Huang',
    bio: "Co-founder of The Neuron. I break down AI trends with a mix of high-signal analysis and terrible jokes. Making sense of the AI revolution so business leaders don't have to.",
    style: 'Humorous, business-casual, high-signal, punchy.'
  },
  {
    name: 'Zain Kahn',
    bio: 'The "AI Guy" on X. Focused on helping 1M+ professionals use AI to boost productivity and advance their careers. Practical prompts over theoretical hype.',
    style: 'Educational, productivity-focused, step-by-step guides.'
  },
  {
    name: 'Andrew Ng',
    bio: "Founder of DeepLearning.AI and Landing AI. Weekly reflections on the state of AI, focusing on the responsible development and deployment of machine learning in society.",
    style: 'Expert-level, measured, academic yet accessible, ethical focus.'
  },
  {
    name: 'Ethan Mollick',
    bio: 'Professor at Wharton. Exploring the practical, real-world impact of AI on work and education through rigorous testing and experimentation. I believe AI is a co-intelligence.',
    style: 'Academic-experimental, insightful, forward-looking, work-centric.'
  },
  {
    name: 'Andrej Karpathy',
    bio: "Ex-Tesla Director of AI and OpenAI co-founder. I build and explain. My focus is on the deep technical architecture of LLMs and making the 'black box' transparent.",
    style: 'Technical deep-dives, developer-focused, "Let\'s build" mentality.'
  },
  {
    name: 'Simon Willison',
    bio: 'Creator of Datasette and co-creator of Django. Independent researcher obsessed with small tools, LLM transparency, and practical coding with AI assistants.',
    style: 'Pragmatic, transparent, documentation-heavy, builder-focused.'
  },
  {
    name: 'Cassie Kozyrkov',
    bio: "Formerly Google's Chief Decision Scientist. Focused on Decision Intelligence—ensuring that data and AI actually lead to better choices for humans and businesses.",
    style: 'Decision-centric, philosophical, human-focused, sharp analysis.'
  }
];

async function updateProfiles() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const res = await client.query('SELECT id FROM public.profiles LIMIT 8');
    const profileIds = res.rows.map(r => r.id);

    for (let i = 0; i < profileIds.length; i++) {
      const persona = personas[i];
      const id = profileIds[i];

      await client.query(
        'UPDATE public.profiles SET display_name = $1, bio = $2 WHERE id = $3',
        [persona.name, persona.bio, id]
      );
      console.log(`Updated profile ${id} to persona: ${persona.name}`);
    }

    console.log('Successfully updated all available editor profiles.');
  } catch (err) {
    console.error('Error updating profiles:', err);
  } finally {
    await client.end();
  }
}

updateProfiles();
