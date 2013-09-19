# --- !Ups

ALTER TABLE bucket ADD UNIQUE(name);

# --- !Downs