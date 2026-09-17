-- LVPT content editing rule:
-- - a user may update content they created (pid = auth.uid())
-- - an admin may update any content
-- Run this in Supabase SQL Editor.

-- Lieux / visites / musées created by users
DROP POLICY IF EXISTS d_lieu_update_any ON public.d_lieu;
DROP POLICY IF EXISTS d_lieu_update_own_or_admin ON public.d_lieu;
CREATE POLICY d_lieu_update_own_or_admin
ON public.d_lieu
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

-- Gastronomy cards created by users
DROP POLICY IF EXISTS d_plat_update_own_or_admin ON public.d_plat;
CREATE POLICY d_plat_update_own_or_admin
ON public.d_plat
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

-- Voyage commun already had owner/admin semantics; make both USING and WITH CHECK explicit.
DROP POLICY IF EXISTS voyage_commun_update_own ON public.s_voyage_commun;
CREATE POLICY voyage_commun_update_own_or_admin
ON public.s_voyage_commun
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

-- Itinerary itself
DROP POLICY IF EXISTS s_itineraire_update_own ON public.s_itineraire;
CREATE POLICY s_itineraire_update_own_or_admin
ON public.s_itineraire
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

-- Itinerary days: owner of parent itinerary or admin
DROP POLICY IF EXISTS s_itineraire_jour_update_own ON public.s_itineraire_jour;
CREATE POLICY s_itineraire_jour_update_own_or_admin
ON public.s_itineraire_jour
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.s_itineraire si
    WHERE si.id_itineraire = s_itineraire_jour.id_itineraire
      AND (
        si.pid = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lvpt l
          WHERE l.id = auth.uid() AND l.is_admin = true
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.s_itineraire si
    WHERE si.id_itineraire = s_itineraire_jour.id_itineraire
      AND (
        si.pid = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lvpt l
          WHERE l.id = auth.uid() AND l.is_admin = true
        )
      )
  )
);

-- Itinerary steps: owner of parent itinerary or admin
DROP POLICY IF EXISTS s_itineraire_step_update_own ON public.s_itineraire_step;
CREATE POLICY s_itineraire_step_update_own_or_admin
ON public.s_itineraire_step
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.s_itineraire_jour sj
    JOIN public.s_itineraire si ON si.id_itineraire = sj.id_itineraire
    WHERE sj.id_jour = s_itineraire_step.id_jour
      AND (
        si.pid = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lvpt l
          WHERE l.id = auth.uid() AND l.is_admin = true
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.s_itineraire_jour sj
    JOIN public.s_itineraire si ON si.id_itineraire = sj.id_itineraire
    WHERE sj.id_jour = s_itineraire_step.id_jour
      AND (
        si.pid = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lvpt l
          WHERE l.id = auth.uid() AND l.is_admin = true
        )
      )
  )
);
