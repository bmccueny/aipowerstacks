CREATE TABLE IF NOT EXISTS tool_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  model_provider text NOT NULL,
  is_primary boolean DEFAULT false,
  use_cases text[] DEFAULT '{}',
  strength_score smallint CHECK (strength_score BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tool_id, model_name)
);

CREATE INDEX tool_models_tool_id_idx ON tool_models(tool_id);
CREATE INDEX tool_models_model_provider_idx ON tool_models(model_provider);
CREATE INDEX tool_models_model_name_idx ON tool_models(model_name);

ALTER TABLE tool_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read tool_models" ON tool_models FOR SELECT USING (true);
CREATE POLICY "service_role can manage tool_models" ON tool_models FOR ALL TO service_role USING (true);

CREATE OR REPLACE FUNCTION handle_tool_models_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_tool_models_updated BEFORE UPDATE ON tool_models FOR EACH ROW EXECUTE PROCEDURE handle_tool_models_updated_at();
