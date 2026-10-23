-- Enable RLS on tables created after 20260331214500_enable_rls_on_public_tables.
-- Prisma connects as the table owner (postgres), which bypasses RLS, so the app is unaffected;
-- this blocks access through Supabase's REST API (anon/authenticated roles).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ServiceAddOn',
    'ServiceAddOnService',
    'ServiceAddOnSubService',
    'AppointmentAddOn',
    'EmployeeServiceDuration',
    'EmployeeServiceRestriction'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;
