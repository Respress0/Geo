# Security Fix: RLS Auto Enable Function

## Problem
The lint rule `0028_anon_security_definer_function_executable` detected a security vulnerability:

- Function `public.rls_auto_enable()` is marked as `SECURITY DEFINER`
- It's callable by the `anon` role via `POST /rest/v1/rpc/rls_auto_enable`
- This allows unauthenticated users to execute privileged operations that bypass RLS

## Risk
Because it's `SECURITY DEFINER`, the function runs with the privileges of its owner (typically postgres/supabase_admin), not the caller. An anonymous user could potentially:
- Perform actions that RLS would normally prevent
- Access data they shouldn't have access to
- Escalate privileges in your database

## Solution Applied

Execute the SQL file `fix_rls_auto_enable_security.sql` in your Supabase SQL Editor:

```bash
# Run this in Supabase Dashboard > SQL Editor
# Or via CLI:
# supabase db execute --file fix_rls_auto_enable_security.sql
```

### What the fix does:

1. **Revokes EXECUTE from anon role** - Unauthenticated users can no longer call this function
2. **Revokes EXECUTE from PUBLIC role** - Removes default public access
3. **Keeps function as SECURITY DEFINER** - Preserves intended behavior for authorized users

## Alternative Solutions

If you need different behavior, choose one of these options instead:

### Option A: Make function accessible to authenticated users only
```sql
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO authenticated;
```

### Option B: Change to SECURITY INVOKER (if RLS bypass isn't needed)
```sql
ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;
```

### Option C: Restrict to service_role only (admin operations)
```sql
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
```

## Verification

After applying the fix, verify with this query:

```sql
SELECT 
  p.proname as function_name,
  pg_catalog.pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('public', p.oid, 'EXECUTE') as public_can_execute
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'rls_auto_enable';
```

Expected result:
- `anon_can_execute`: false
- `public_can_execute`: false

## Next Steps

1. ✅ Execute `fix_rls_auto_enable_security.sql` in Supabase SQL Editor
2. ✅ Verify the lint warning is resolved
3. ✅ Test that your application still works correctly
4. ✅ If needed, grant access to specific roles (see alternatives above)

## References

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Lint Rule 0028](https://supabase.com/docs/guides/database/extensions/supabase-lint)
