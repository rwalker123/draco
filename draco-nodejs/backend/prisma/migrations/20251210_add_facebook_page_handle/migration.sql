-- Add pagehandle column for storing the chosen Facebook page handle
ALTER TABLE accountfacebookcredentials
ADD COLUMN pagehandle VARCHAR(150);
