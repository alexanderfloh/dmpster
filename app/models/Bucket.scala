package models

import play.api.db._
import play.api.Play.current
import anorm._
import anorm.SqlParser._
import language.postfixOps
import play.api.libs.json._

case class Bucket(
  id: Long,
  name: String,
  notes: String) extends Taggable {
  
  

  val url = "bucket"
  def fullUrl = s"/dmpster/$url/$id"

  def tags = Tag.forBucket(this)
}

object Bucket {
  type GroupedBuckets = List[(Bucket, List[Dump])]
  
  def all: List[Bucket] = DB.withConnection { implicit c =>
    SQL("select * from bucket").as(bucket *)
  }

  def create(name: String): Option[Long] = DB.withConnection { implicit c =>
    SQL("insert into bucket (name) select ({name}) where not exists (select * from bucket where name = {name})")
      .on('name -> name)
      .executeInsert()
  }

  def findOrCreate(name: String): Bucket = DB.withConnection { implicit c =>
    findByName(name)
      .getOrElse(create(name).flatMap(byId) // does not exist yet, create it
        .getOrElse(findByName(name).get)) // someone created it at the same time, re-find by name
  }

  def findByName(name: String): Option[Bucket] = DB.withConnection { implicit c =>
    SQL("select * from bucket where name = {name}").on('name -> name)
      .as(bucket singleOpt)
  }

  def byId(id: Long) = DB.withConnection { implicit c =>
    SQL("select * from bucket where id = {id}").on('id -> id).as(bucket singleOpt)
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

  def updateNotes(id: Long, text: String) =
    DB.withConnection { implicit c =>
      SQL"update bucket set notes=$text where id=$id".executeUpdate
    }

  def bucketsSortedByDate(limit: Option[Int] = None) = DB.withConnection { implicit c =>
    limit.map(count => {
      SQL"""
      SELECT * 
        FROM (SELECT bucketId, MAX(timestamp) FROM bucket_hits GROUP BY bucketId ORDER BY MAX(timestamp) DESC LIMIT $count) as hits
        LEFT JOIN bucket
        ON bucket.id = hits.bucketId
       """.as(bucket *)
    }).getOrElse {
      SQL"""
      SELECT * 
        FROM (SELECT bucketId, MAX(timestamp) FROM bucket_hits GROUP BY bucketId ORDER BY MAX(timestamp) DESC) as hits
        LEFT JOIN bucket
        ON bucket.id = hits.bucketId
       """.as(bucket *)
    }

  }

  def bucketsSortedByDate2() = DB.withConnection { implicit c =>
    SQL"""
      SELECT DISTINCT buckets.id, buckets.name, buckets.notes, buckets.ts  FROM
        (SELECT * 
          FROM (SELECT bucketId, MAX(timestamp) as ts FROM bucket_hits GROUP BY bucketId ORDER BY MAX(timestamp) DESC) as hits
          LEFT JOIN bucket
          ON bucket.id = hits.bucketId) as buckets
        INNER JOIN dump
        ON buckets.id = dump.bucketId ORDER BY buckets.ts DESC
    """.as(bucket *)

  }

  /*
SELECT buckets.id as bucketId, dump.id as dumpId, buckets.Name, buckets.Notes, dump.fileName FROM
    (SELECT * 
        FROM (SELECT bucketId, MAX(timestamp) FROM bucket_hits GROUP BY bucketId ORDER BY MAX(timestamp) DESC) as hits
        LEFT JOIN bucket
        ON bucket.id = hits.bucketId) as buckets
INNER JOIN dump
ON buckets.id = dump.bucketId
   * 
   */

  def bucket = {
    get[Long]("id") ~
      get[String]("name") ~
      get[String]("notes") map {
        case id ~ name ~ notes => Bucket(id, name, notes)
      }
  }

  val jsonWriter = Writes[Bucket](b => {
    implicit val tagFormat = Tag.nameOnlyFormat
    Json.obj(
      "id" -> b.id,
      "name" -> b.name,
      "notes" -> b.notes,
      "url" -> b.fullUrl,
      "tagging" -> Json.obj(
        "tags" -> Json.toJson(b.tags),
        "addTagUrl" -> b.addTagUrl,
        "removeTagUrl" -> b.removeTagUrl))
  })

}