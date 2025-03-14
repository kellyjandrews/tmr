CREATE POLICY "Users can view their own stores" 
ON stores 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Public can view all stores" 
ON stores 
FOR SELECT 
TO anon 
USING (true);