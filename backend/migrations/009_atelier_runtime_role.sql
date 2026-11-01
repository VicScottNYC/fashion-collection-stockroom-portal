-- Sprint 6.2.25E-2D-3
-- Restricted ATELIER application database role.
-- Prepared for testing; not yet deployed.

BEGIN;


-- Refuse deployment if product RLS is disabled.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.products'::regclass
          AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION
            'ATELIER deployment blocked: product RLS is disabled';
    END IF;
END;
$$;

CREATE ROLE atelier_app
    NOLOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    NOBYPASSRLS
    NOINHERIT;

GRANT USAGE ON SCHEMA public
TO atelier_app;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.products
TO atelier_app;

GRANT USAGE
ON SEQUENCE public.products_id_seq
TO atelier_app;

REVOKE ALL ON TABLE public.user_roles
FROM atelier_app;

-- Orphan tracking may not exist yet.
-- Its access restrictions are managed separately.

CREATE POLICY atelier_app_shared_inventory
ON public.products
AS PERMISSIVE
FOR ALL
TO atelier_app
USING (true)
WITH CHECK (true);

COMMIT;
