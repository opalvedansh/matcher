CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default weights for the matchmaking algorithm if they don't exist
INSERT INTO admin_settings (key, value)
VALUES (
    'algorithm_weights',
    '{"CATEGORY_OVERLAP": 40, "BUDGET_FIT": 30, "LOCATION_MATCH": 20, "COMPLETENESS": 10}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
