# Buckets schema
 
# --- !Ups

CREATE SEQUENCE bucket_id_seq;
CREATE TABLE bucket (
    id integer NOT NULL DEFAULT nextval('bucket_id_seq'),
    name varchar(255),
    filename varchar(255),
    content CLOB,
    timestamp TIMESTAMP
);

CREATE SEQUENCE tag_id_seq;
CREATE TABLE tag (
    id integer NOT NULL DEFAUL nextval('tag_id_seq'),
    name varchar(255) NOT NULL
);
 
# --- !Downs
 
DROP TABLE bucket;
DROP TABLE tag;
DROP SEQUENCE bucket_id_seq;
DROP SEQUENCE tag_id_seq;