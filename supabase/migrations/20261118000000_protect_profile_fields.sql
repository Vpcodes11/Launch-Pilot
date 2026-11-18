-- RLS enforces profile ownership. Column grants protect billing and admin fields.
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (name) ON public.profiles TO authenticated;

ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
