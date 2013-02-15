# Buckets schema
 
# --- !Ups

CREATE SEQUENCE bucket_id_seq;
CREATE TABLE bucket (
    id integer NOT NULL DEFAULT nextval('bucket_id_seq'),
    name varchar(255),
    filename varchar(255),
    content CLOB
);
 
# --- !Downs
 
DROP TABLE bucket;
DROP SEQUENCE bucket_id_seq;