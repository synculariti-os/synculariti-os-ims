CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    flag_key VARCHAR NOT NULL,
    flag_value BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT feature_flags_restaurant_key_unique UNIQUE (restaurant_id, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_restaurant_id ON public.feature_flags(restaurant_id);

-- Apply RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read feature flags for their active restaurant"
    ON public.feature_flags
    FOR SELECT
    USING (
        restaurant_id = (current_setting('app.current_restaurant_id', true))::uuid
    );

CREATE POLICY "Users can update feature flags for their active restaurant"
    ON public.feature_flags
    FOR UPDATE
    USING (
        restaurant_id = (current_setting('app.current_restaurant_id', true))::uuid
    );

CREATE POLICY "Users can insert feature flags for their active restaurant"
    ON public.feature_flags
    FOR INSERT
    WITH CHECK (
        restaurant_id = (current_setting('app.current_restaurant_id', true))::uuid
    );
