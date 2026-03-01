import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const updates = [
  { id: 'bb667f35-f8d8-4753-a9d6-bda55ec243f3', cat: '6d289a7f-ea6b-4e85-ad69-099f2bfb5439', pricing: 'freemium' }, // Claude 4.6
  { id: '8b7610fb-e4e4-4f25-beba-b61dc6007cfa', cat: '6d289a7f-ea6b-4e85-ad69-099f2bfb5439', pricing: 'freemium' }, // Gemini 3.1
  { id: '3da579c5-6ba2-45fd-b2d8-478044c922da', cat: 'b2f87664-7efb-4574-84c4-2c401dc180e6', pricing: 'paid' },     // Seedance 2.0
  { id: 'f7a3218c-7b15-4b41-b611-30bdd1b9b3f8', cat: '8eb0ff16-1145-4b1c-b89c-5a3247f2076f', pricing: 'paid' },     // Whisper Flow
  { id: 'b0c5aaef-fb78-41be-bbca-acad8661f42a', cat: 'b2f87664-7efb-4574-84c4-2c401dc180e6', pricing: 'freemium' }, // Kling AI
  { id: 'fa1a62a6-a93b-4176-8238-82f24788ff7a', cat: '8eb0ff16-1145-4b1c-b89c-5a3247f2076f', pricing: 'freemium' }, // Super Whisper
  { id: 'ebb65a70-7d6d-4456-a626-1f029a391009', cat: 'c0dd3e25-8e83-4434-a0d5-ddccbdc1bb9c', pricing: 'paid' },     // MarketMind AI
  { id: 'fd8d545b-a9ed-4fc8-9b8b-e85e0cc07953', cat: '0b441a80-f6a8-4198-a4f8-25c93a766857', pricing: 'free' },     // Norton Neo Browser
  { id: '0c5719bc-8527-41c1-ba75-4f3131cb6132', cat: '6afc6562-17f4-4a21-8f98-321dfe48f195', pricing: 'free' },     // Echo Now AI
  { id: 'cfcf6b02-41a3-45a4-991e-cec97c12938e', cat: '025322e6-cea0-475e-a3cb-60b86c88456f', pricing: 'free' },     // NBot AI
  { id: 'f036e11a-3da3-4113-ace3-641ba9b09355', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' },     // DailyScope AI
  { id: 'f6c30647-0078-43f1-8bc9-9a5d7a40bc2f', cat: '8bcd611b-2cb7-4c2e-baaf-ff844cc38ea4', pricing: 'freemium' }, // TuckMeIn
  { id: 'a9637f0d-eeda-42f7-8f59-e38ff2eaf019', cat: '7561abd9-0ba5-4024-9553-25e2ad6fa58b', pricing: 'freemium' }, // Muses AI
  { id: '6fca4928-2510-4f07-aa4d-aeda2e6f4778', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' },     // WP Now
  { id: '1ccea9a3-76f3-4ff4-9827-0606acd4e0eb', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' },     // TIMIO News
  { id: 'e1e83b78-5a2b-4c03-93b7-dab07c6a1df6', cat: '75ce54de-1631-4e29-9d11-02162ee9beea', pricing: 'paid' },     // StockNewsAI
  { id: '348b24a1-41a2-48d8-9ea0-01738c87b7c4', cat: '0b441a80-f6a8-4198-a4f8-25c93a766857', pricing: 'free' },     // Resolution Builder
  { id: '5013b2dc-cc45-491f-9072-8a97200b68ee', cat: '6c96a26a-4422-4c71-bf0e-6e79addd431a', pricing: 'contact' },  // Sherlocks AI
  { id: '1db53ddb-9af0-480f-94cc-948458a49515', cat: '67467ea7-c55b-4bbd-811c-e7aeda7a3c59', pricing: 'paid' },     // New Dialogue
  { id: '9932a0fb-02b5-4714-9fa5-a041b5a68b33', cat: '7561abd9-0ba5-4024-9553-25e2ad6fa58b', pricing: 'freemium' }, // Mavis AI
  { id: '54a58e60-8835-4056-a415-6d3f5ca866fb', cat: 'c0dd3e25-8e83-4434-a0d5-ddccbdc1bb9c', pricing: 'paid' },     // ReadPartner
  { id: '76579ee0-7a12-4ceb-9d54-b7804d44ac09', cat: '4e55c5b0-5357-4c07-9045-3d33697fecb1', pricing: 'paid' },     // Vectara
  { id: 'ae2f387a-3b98-499a-8787-038db375d42d', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' },     // Neus AI
  { id: '42682481-7475-4c50-ab74-7d891b5a1548', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' },     // I Doubt News
  { id: 'ed8d5cb9-d6b2-4c52-b4ff-82268856bd9a', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' },     // Boring Report
  { id: '2d69776f-90b7-4845-bc6d-116fb09bc166', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' },     // NewsGPT
  { id: 'd5f23e75-34fd-40f4-bb73-ec635fffe7e1', cat: '6e149cfc-aaf9-4f73-9620-7f9f5ba536a7', pricing: 'free' }      // ClarityPage
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  for (const u of updates) {
    try {
      await client.query(
        "UPDATE public.tools SET category_id = $1, pricing_model = $2, status = 'published' WHERE id = $3",
        [u.cat, u.pricing, u.id]
      );
      console.log(`Published ${u.id}`);
    } catch (e) {
      console.error(`Error with ${u.id}:`, e.message);
    }
  }

  await client.end();
}

main().catch(console.error);
