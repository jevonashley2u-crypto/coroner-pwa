-- ============================================================================
-- Migration: 001_init_coroner_schema
-- Description: Creates the cases and tattoos_scars tables with strict RLS
--              policies matching the PWA Dexie.js payload structures.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. cases
--    Maps 1:1 to the frontend Case interface (src/db/db.ts).
--    images is stored as jsonb[] (base64 data-urls from canvas snapshots).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cases (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    case_number         TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'closed', 'pending')),
    date_created        TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_modified       TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- decedent
    decedent_name       TEXT        NOT NULL,
    decedent_dob        DATE,
    decedent_gender     TEXT,
    decedent_race       TEXT,

    -- scene
    address             TEXT        NOT NULL DEFAULT '',
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),

    discovery_timestamp TIMESTAMPTZ,
    arrival_timestamp   TIMESTAMPTZ,
    ambient_temperature NUMERIC(5,1),
    body_temperature    NUMERIC(5,1),
    temperature_unit    TEXT        NOT NULL DEFAULT 'C'
                        CHECK (temperature_unit IN ('C', 'F')),
    weather_conditions  TEXT,

    -- investigation
    investigating_officer TEXT,
    preliminary_cause     TEXT,
    notes                 TEXT,

    -- evidence (base64 data-url array from camera canvas snapshots)
    images              JSONB       NOT NULL DEFAULT '[]'::jsonb,

    -- medical device lookups (FDA GUDID)
    medical_devices     JSONB       NOT NULL DEFAULT '[]'::jsonb,

    -- audit
    created_by          UUID        NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- indexes for common query patterns
CREATE UNIQUE INDEX idx_cases_case_number ON public.cases(case_number);
CREATE INDEX idx_cases_created_by        ON public.cases(created_by);
CREATE INDEX idx_cases_status            ON public.cases(status);
CREATE INDEX idx_cases_date_created      ON public.cases(date_created DESC);


-- ----------------------------------------------------------------------------
-- 2. tattoos_scars
--    Maps 1:1 to the frontend PhysicalMark interface.
--    FK cascades so removing a case removes its marks.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tattoos_scars (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    case_id         BIGINT      NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,

    mark_type       TEXT        NOT NULL
                    CHECK (mark_type IN ('tattoo', 'scar', 'birthmark', 'fracture', 'burn', 'other')),
    description     TEXT        NOT NULL DEFAULT '',
    body_location   TEXT        NOT NULL DEFAULT '',
    size_mm         TEXT,
    color           TEXT,
    shape           TEXT,
    orientation     TEXT,
    image_base64    TEXT,
    notes           TEXT,
    date_created    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- audit
    created_by      UUID        NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tattoos_scars_case_id    ON public.tattoos_scars(case_id);
CREATE INDEX idx_tattoos_scars_mark_type  ON public.tattoos_scars(mark_type);
CREATE INDEX idx_tattoos_scars_created_by ON public.tattoos_scars(created_by);


-- ============================================================================
-- ROW LEVEL SECURITY
-- Every operation is scoped to the authenticated user.
-- ============================================================================

ALTER TABLE public.cases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tattoos_scars ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- cases policies
-- ----------------------------------------------------------------------------

CREATE POLICY "cases_insert_own" ON public.cases
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "cases_select_own" ON public.cases
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "cases_update_own" ON public.cases
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "cases_delete_own" ON public.cases
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- ----------------------------------------------------------------------------
-- tattoos_scars policies
-- ----------------------------------------------------------------------------

CREATE POLICY "tattoos_scars_insert_own" ON public.tattoos_scars
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "tattoos_scars_select_own" ON public.tattoos_scars
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "tattoos_scars_update_own" ON public.tattoos_scars
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "tattoos_scars_delete_own" ON public.tattoos_scars
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());


-- ============================================================================
-- HELPER: updated_at trigger (optional, keeps date_modified current)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modified = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cases_modified ON public.cases;
CREATE TRIGGER trg_cases_modified
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_modified_timestamp();
