# Buckets schema

# --- !Ups
CREATE INDEX BUCKET_HIT_TS_INDEX ON Bucket_Hits(timestamp);
CREATE UNIQUE INDEX BUCKET_HIT_ID_INDEX ON Bucket_Hits(id);
CREATE UNIQUE INDEX BUCKET_ID on Bucket(id);


# --- !Downs
DROP INDEX IF EXISTS BUCKET_HIT_TS_INDEX;
DROP INDEX IF EXISTS BUCKET_HIT_ID_INDEX;
DROP INDEX IF EXISTS BUCKET_ID;