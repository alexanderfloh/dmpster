# Buckets schema

# --- !Ups
CREATE SEQUENCE bucket_hit_id_seq;
CREATE TABLE bucket_hits (
    id integer NOT NULL DEFAULT nextval('bucket_hit_id_seq'),
    dumpId integer,
    bucketId integer NOT NULL,
    timestamp TIMESTAMP
);



# --- !Downs
DROP TABLE bucket_hits;
DROP SEQUENCE bucket_hit_id_seq;
