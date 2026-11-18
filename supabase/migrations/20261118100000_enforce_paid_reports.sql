-- LaunchPilot serves these tables through owner-checked server routes.
REVOKE ALL ON public.products, public.product_platforms, public.orders FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.product_platforms, public.orders TO service_role;

CREATE OR REPLACE FUNCTION public.complete_launchpilot_order(
  payment_provider text, payment_ref text, payment_amount numeric, payment_currency text
)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  checkout public.orders;
BEGIN
  SELECT * INTO STRICT checkout FROM public.orders
  WHERE provider = payment_provider AND provider_ref = payment_ref
  FOR UPDATE;

  IF checkout.amount IS DISTINCT FROM payment_amount OR checkout.currency IS DISTINCT FROM payment_currency THEN
    RAISE EXCEPTION 'Payment does not match order';
  END IF;

  IF checkout.status <> 'pending' THEN
    RETURN;
  END IF;

  UPDATE public.orders SET status = 'completed' WHERE id = checkout.id RETURNING * INTO checkout;

  IF checkout.product_id IS NOT NULL AND checkout.plan IN ('launch_kit', 'done_for_you') THEN
    UPDATE public.products SET status = 'paid'
    WHERE id = checkout.product_id AND user_id = checkout.user_id
      AND status IN ('draft', 'analyzed');
  END IF;

  RETURN NEXT checkout;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_launchpilot_order(text, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_launchpilot_order(text, text, numeric, text) TO service_role;
