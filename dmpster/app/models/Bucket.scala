package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current
import java.util.Date
import java.util.GregorianCalendar
import java.util.Calendar

case class Bucket(
  id: Long,
  name: String,
  filename: String,
  content: String,
  timestamp: Date) {

  def isNew = {
    val tsCal = new GregorianCalendar()
    tsCal.setTime(timestamp)
    val calendar = new GregorianCalendar()
    calendar.add(Calendar.DAY_OF_MONTH, -1)
    calendar.before(tsCal)
  }
}

object Bucket {
  def all: List[Bucket] = DB.withConnection { implicit c =>
    SQL("select * from bucket").as(bucket *)
  }

  def create(name: String, filename: String, content: String) = {
    DB.withConnection { implicit c =>
      SQL("insert into bucket (name, filename, content, timestamp) " +
        "values ({name}, {filename}, {content}, {timestamp})").on(
        'name -> name,
        'filename -> filename,
        'content -> content,
        'timestamp -> new Date()).executeUpdate
    }
  }

  def addTag(bucket: Bucket, tag: Tag) =
    DB.withConnection { implicit c =>
      SQL("insert into bucketToTag (bucketId, tagId) values ({bucketId}, {tagId})")
        .on('bucketId -> bucket.id, 'tagId -> tag.id).executeUpdate
    }

  def delete(id: Long) = {
    DB.withConnection { implicit c =>
      SQL("delete from bucket where id = {id}").on('id -> id).executeUpdate
    }
  }

  val bucket = {
    get[Long]("id") ~
      get[String]("name") ~
      get[String]("filename") ~
      get[String]("content") ~
      get[Date]("timestamp") map {
        case id ~ name ~ filename ~ content ~ timestamp =>
          Bucket(id, name, filename, content, timestamp)
      }
  }
}