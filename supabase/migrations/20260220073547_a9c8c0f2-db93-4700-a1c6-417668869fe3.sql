CREATE POLICY "Anyone can upload applicant avatars"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'applicants');