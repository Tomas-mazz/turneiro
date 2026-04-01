-- Enable Row Level Security on all public tables exposed by Supabase PostgREST.
-- The app reads/writes through the backend with Prisma and JWT auth, so PostgREST
-- should not have open access to these tables.
DO $$
BEGIN
  IF to_regclass('public."_prisma_migrations"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."WorkingHours"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."WorkingHours" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Service"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Service" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Subscription"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."User"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."BlockedSlot"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."BlockedSlot" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Employee"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Employee" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Business"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Business" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."SubService"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."SubService" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Appointment"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Appointment" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."NotificationDelivery"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."NotificationDelivery" ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."BusinessSettings"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."BusinessSettings" ENABLE ROW LEVEL SECURITY';
  END IF;
END
$$;
