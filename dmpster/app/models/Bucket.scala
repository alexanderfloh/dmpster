package models

import play.api.db._
import play.api.Play.current
import anorm._
import anorm.SqlParser._

case class Bucket(
  id: Long,
  name: String) extends Taggable {
  
  val url = "bucket"
  def tags = Tag.forBucket(this)
}

object Bucket {
  def all: List[Bucket] = DB.withConnection { implicit c =>
    SQL("select * from bucket").as(bucket *)
  }

  def create(name: String): Option[Long] = DB.withConnection { implicit c =>
    SQL("insert into bucket (name) values ({name})")
      .on('name -> name)
      .executeInsert()
  }

  def byId(id: Long) = DB.withConnection { implicit c =>
    SQL("select * from bucket where id = {id}").on('id -> id).as(bucket single)
  }

  def addTag(bucket: Bucket, tag: Tag) =
    DB.withConnection { implicit c =>
      SQL("insert into bucketToTag (bucketId, tagId) values ({bucketId}, {tagId})")
        .on('bucketId -> bucket.id, 'tagId -> tag.id).executeUpdate
    }

  def removeTag(bucket: Bucket, tag: Tag) =
    DB.withConnection { implicit c =>
      SQL("delete from bucketToTag where bucketId = {bucketId} and tagId = {tagId}")
        .on('bucketId -> bucket.id, 'tagId -> tag.id).executeUpdate
    }

  def bucket = {
    get[Long]("id") ~
      get[String]("name") map {
        case id ~ name => Bucket(id, name)
      }
  }
}