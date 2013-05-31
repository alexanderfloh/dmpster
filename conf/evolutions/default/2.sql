# --- !Ups

ALTER TABLE bucket ALTER COLUMN name CLOB not null;

# --- !Downs