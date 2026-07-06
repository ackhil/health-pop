-- One-time backfill: public_profiles.photo_path is only synced on saveProfile() writes.
-- Anyone who uploaded a photo before this feature shipped has photoPath in profiles.data
-- but a null public_profiles.photo_path, so friends never see it. Safe to run any number
-- of times — only touches rows that are actually missing the sync.
update public_profiles pp
set photo_path = p.data->>'photoPath'
from profiles p
where p.user_id = pp.user_id
  and p.data->>'photoPath' is not null
  and pp.photo_path is distinct from p.data->>'photoPath';
