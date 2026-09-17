-- Spa & bien-être: user-generated content
-- - Free users can create a spa card.
-- - A user can update only their own spa (pid = auth.uid()).
-- - Admin can update any spa.
-- Technical table/column names remain unchanged.

DROP POLICY IF EXISTS s_spa_insert_authenticated ON public.s_spa;
CREATE POLICY s_spa_insert_authenticated
ON public.s_spa
FOR INSERT
TO authenticated
WITH CHECK (
  pid = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.lvpt l
    WHERE l.id = auth.uid() AND l.is_admin = true
  )
);

DROP POLICY IF EXISTS s_spa_update_own_or_admin ON public.s_spa;
CREATE POLICY s_spa_update_own_or_admin
ON public.s_spa
FOR UPDATE
TO authenticated
USING (
  pid = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.lvpt l
    WHERE l.id = auth.uid() AND l.is_admin = true
  )
)
WITH CHECK (
  pid = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.lvpt l
    WHERE l.id = auth.uid() AND l.is_admin = true
  )
);
