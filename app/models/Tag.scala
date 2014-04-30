package models

import play.api.db._
import play.api.Play.current
import anorm._
import anorm.SqlParser._
import language.postfixOps
import java.net.URLEncoder
import play.api.libs.json.Json
import play.api.libs.json.Writes

trait Taggable {
  val url: String
  val id: Long
  def tags: List[Tag]

  def addTagUrl = s"/dmpster/$url/$id/addTag/"
  def removeTagUrl = s"/dmpster/$url/$id/removeTag/"
}

case class Tag(id: Long, name: String) {
  val nameUrlEncoded = URLEncoder.encode(name, "UTF-8").replace("+", "%20")
}

object Tag {
  def all: List[Tag] = DB.withConnection {
    implicit c =>
      SQL("select * from tag").as(tag *)
  }

  def forDump(dump: Dump) = DB.withConnection { implicit c =>
    {
      SQL("select * from dumpToTag dtt inner join tag t on t.id = dtt.tagId where dtt.dumpId = {dumpId}")
        .on('dumpId -> dump.id).as(tag *)
    }
  }

  def forBucket(bucket: Bucket) = DB.withConnection { implicit c =>
    {
      SQL("select * from bucketToTag btt inner join tag t on t.id = btt.tagId where btt.bucketId = {bucketId}")
        .on('bucketId -> bucket.id).as(tag *)
    }
  }

  def create(name: String) = {
    DB.withConnection {
      implicit c =>
        SQL("insert into tag (name) select ({name}) where not exists (select * from tag where name = {name})")
          .on('name -> name).executeInsert()
    }
  }

  def findByName(name: String) = {
    DB.withConnection {
      implicit c =>
        SQL("select * from tag where name = {name}")
          .on('name -> name).as(tag.singleOpt)
    }
  }

  def findOrCreate(name: String): Tag = {
    findByName(name)
      .getOrElse(create(name)
        .map(id => Tag(id, name))
        .getOrElse(findByName(name).get)) // concurrent insert, just re-query 
  }

  def tag = {
    get[Long]("id") ~
      get[String]("name") map {
        case id ~ name => Tag(id, name)
      }
  }

  val nameOnlyFormat = Writes[Tag] (t => Json.obj("name" -> t.name))
}

object TagParser {
  def unapply(tagName: String) = {
    val trimmed = tagName.trim
    if (!trimmed.isEmpty) Some(Tag.findOrCreate(trimmed))
    else None
  }
}