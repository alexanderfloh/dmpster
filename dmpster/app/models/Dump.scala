package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current
import java.util.Date
import org.joda.time.DateTime
import org.joda.time.Days

case class Dump (
  id: Long,
  bucket: Bucket,
  filename: String,
  content: String,
  timestamp: DateTime) extends Taggable {
  
  val url = "dmp"

  def isNew = timestamp.plusDays(1).isAfterNow
  
  def ageInDays = Days.daysBetween(timestamp, DateTime.now).getDays
  
  def tags = Tag.forDump(this)
}

object Dump {
  def all: List[Dump] = DB.withConnection { implicit c =>
    SQL("select * from dump").as(dump *)
  }

  def byId(id: Long) = DB.withConnection { implicit c =>
    SQL("select * from dump where id = {id}").on('id -> id).as(dump.singleOpt)
  }

  def create(bucket: Bucket, filename: String, content: String) = {
    DB.withConnection { implicit c =>
      SQL("insert into dump (bucketId, filename, content, timestamp) " +
        "values ({bucketId}, {filename}, {content}, {timestamp})").on(
        'bucketId -> bucket.id,
        'filename -> filename,
        'content -> content,
        'timestamp -> DateTime.now.toDate).executeUpdate
    }
  }

  def addTag(dump: Dump, tag: Tag) =
    DB.withConnection { implicit c =>
      SQL("insert into dumpToTag (dumpId, tagId) values ({dumpId}, {tagId})")
        .on('dumpId -> dump.id, 'tagId -> tag.id).executeUpdate
    }

  def removeTag(dump: Dump, tag: Tag) =
    DB.withConnection { implicit c =>
      SQL("delete from dumpToTag where dumpId = {dumpId} and tagId = {tagId}")
        .on('dumpId -> dump.id, 'tagId -> tag.id).executeUpdate
    }

  def delete(id: Long) = {
    DB.withConnection { implicit c =>
      SQL("delete from dump where id = {id}").on('id -> id).executeUpdate
    }
  }

  val dump = {
    get[Long]("id") ~
      get[Long]("bucketId") ~
      get[String]("filename") ~
      get[String]("content") ~
      get[Date]("timestamp") map {
        case id ~ bucketId ~ filename ~ content ~ timestamp =>
          Dump(id, Bucket.byId(bucketId), filename, content, new DateTime(timestamp))
      }
  }
}