-- Fix for lint warning 0028_anon_security_definer_function_executable
-- This removes the security vulnerability where anon users can execute 
-- SECURITY DEFINER function rls_auto_enable() via POST /rest/v1/rpc/

-- Step 1: Revoke EXECUTE privilege from anon and PUBLIC roles
-- This prevents unauthenticated users from calling this function
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public;

-- Step 2 (Optional): If you need to grant access to specific roles, use:
-- GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO authenticated;
-- Or only to service_role for admin operations:
-- GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

-- Step 3 (Alternative): If the function doesn't need to bypass RLS,
-- you can change it to SECURITY INVOKER instead:
-- ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;

-- Verification query to confirm the fix:
-- SELECT 
--   p.proname as function_name,
--   pg_catalog.pg_get_userbyid(p.proowner) as owner,
--   p.prosecdef as security_definer,
--   has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
--   has_function_privilege('public', p.oid, 'EXECUTE') as public_can_execute
-- FROM pg_catalog.pg_proc p
-- JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname = 'rls_auto_enable';
