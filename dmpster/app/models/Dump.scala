package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current
import java.util.Date
import java.util.GregorianCalendar
import java.util.Calendar

case class Dump(
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

object Dump {
  def all: List[Dump] = DB.withConnection { implicit c =>
    SQL("select * from dump").as(dump *)
  }

  def byId(id: Long) = DB.withConnection { implicit c =>
    SQL("select * from dump where id = {id}").on('id -> id).as(dump.singleOpt)
  }

  def create(name: String, filename: String, content: String) = {
    DB.withConnection { implicit c =>
      SQL("insert into dump (name, filename, content, timestamp) " +
        "values ({name}, {filename}, {content}, {timestamp})").on(
        'name -> name,
        'filename -> filename,
        'content -> content,
        'timestamp -> new Date()).executeUpdate
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
      get[String]("name") ~
      get[String]("filename") ~
      get[String]("content") ~
      get[Date]("timestamp") map {
        case id ~ name ~ filename ~ content ~ timestamp =>
          Dump(id, name, filename, content, timestamp)
      }
  }
}