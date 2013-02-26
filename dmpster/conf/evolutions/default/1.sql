# Buckets schema
 
# --- !Ups

CREATE SEQUENCE dump_id_seq;
CREATE TABLE dump (
    id integer NOT NULL DEFAULT nextval('dump_id_seq'),
    name varchar(255),
    filename varchar(255),
    content CLOB,
    timestamp TIMESTAMP
);

CREATE SEQUENCE tag_id_seq;
CREATE TABLE tag (
    id integer NOT NULL DEFAULT nextval('tag_id_seq'),
    name varchar(255) NOT NULL
);

CREATE TABLE dumpToTag (
    dumpId integer NOT NULL,
    tagId integer NOT NULL
);
 
# --- !Downs
 
DROP TABLE dump;
DROP TABLE tag;
DROP TABLE dumpToTag;
DROP SEQUENCE dump_id_seq;
DROP SEQUENCE tag_id_seq;