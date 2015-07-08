# Buckets schema

# --- !Ups
CREATE SEQUENCE bucket_hit_id_seq;
CREATE TABLE bucket_hits (
    id integer NOT NULL DEFAULT nextval('bucket_hit_id_seq'),
    dumpId integer,
    bucketId integer NOT NULL,
    timestamp TIMESTAMP
) AS SELECT nextval('bucket_hit_id_seq'), dump.id AS dumpId, dump.bucketId, dump.timestamp FROM dump;

ALTER TABLE bucket ADD COLUMN notes CLOB NOT NULL DEFAULT '';

# --- !Downs
DROP TABLE bucket_hits;
DROP SEQUENCE bucket_hit_id_seq;
ALTER TABLE bucket DROP COLUMN notes;
