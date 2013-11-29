package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current
import java.util.Date
import org.joda.time.DateTime
import org.joda.time.Days
import scala.collection.immutable.ListMap
import language.postfixOps
import org.joda.time.format.DateTimeFormat
import org.joda.time.DateTimeConstants

case class Dump(
  id: Long,
  bucket: Bucket,
  relFilePath : String,
  content: String,
  timestamp: DateTime) extends Taggable {

  val url = "dmp"

  /** 
   * Reference for 'now' instant in time. 
   * The intention for this is to be able to provide a custom implementation in unit tests. 
   */
  protected def now = DateTime.now
  
  private def firstDayOfNewness = {
    now.getDayOfWeek() match {
      case DateTimeConstants.MONDAY => now.minusDays(3).withTimeAtStartOfDay
      case _ => now.minusDays(1).withTimeAtStartOfDay
    }
  }

  def isNew = firstDayOfNewness.isBefore(timestamp)

  def ageInDays = Days.daysBetween(timestamp, now).getDays

  def tags = Tag.forDump(this)
  
  val filename = new java.io.File(relFilePath).getName;
  
  private def isFromToday = now.withTimeAtStartOfDay.isBefore(timestamp)

  def dateFormatted = {
    if (isFromToday) "today " + timestamp.toString(DateTimeFormat.forPattern("HH:mm"))
    else timestamp.toString(DateTimeFormat.forPattern("YYYY-MM-dd HH:mm"))
  }
}

object Dump {
  def all: List[Dump] = DB.withConnection { implicit c =>
    SQL("select * from dump").as(dump *)
  }

  def newerThan(time: DateTime): List[Dump] = DB.withConnection { implicit c =>
    SQL("select * from dump where timestamp > {timestamp}")
      .on('timestamp -> time.toDate).as(dump *)
  }

  def olderThan(time: DateTime): List[Dump] = DB.withConnection { implicit c =>
    SQL("select * from dump where timestamp < {timestamp}")
      .on('timestamp -> time.toDate).as(dump *)
  }

  def byId(id: Long) = DB.withConnection { implicit c =>
    SQL("select * from dump where id = {id}").on('id -> id).as(dump.singleOpt)
  }

  def byBucket(bucket: Bucket) = DB.withConnection { implicit c =>
    SQL("select * from dump where bucketId = {bucketId}")
      .on('bucketId -> bucket.id).as(dump *)
  }

  def byTag(tag: Tag) = DB.withConnection { implicit c =>
    SQL("select * from dumpToTag dtt inner join dump d on d.id = dtt.dumpId where dtt.tagId = {tagId}")
      .on('tagId -> tag.id).as(dump *)
  }

  def create(bucket: Bucket, relFilePath: String, content: String): Dump = {
    val timestamp = DateTime.now
    DB.withConnection { implicit c =>
      SQL("insert into dump (bucketId, filename, content, timestamp) " +
        "values ({bucketId}, {filename}, {content}, {timestamp})")
        .on(
          'bucketId -> bucket.id,
          'filename -> relFilePath,
          'content -> content,
          'timestamp -> timestamp.toDate)
        .executeInsert() match {
          case Some(id) => Dump(id, bucket, relFilePath, content, timestamp)
          case None => throw new Exception("unable to insert dump into db")
        }
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

  def groupDumpsByBucket(dumps: List[Dump]) = {
    import utils.Joda._

    val dumpsByBucket = dumps.groupBy(_.bucket)
    val sortedDumpsByBucket = dumpsByBucket.map {
      case (bucket, dumps) => {
        val sortedDumps = dumps.sortBy(_.timestamp)
        ((bucket, sortedDumps.head), sortedDumps)
      }
    }
    ListMap(sortedDumpsByBucket.toList.sortBy { case ((bucket, newest), dumps) => newest.timestamp }: _*)
  }

  val dump = {
    get[Long]("id") ~
      get[Long]("bucketId") ~
      get[String]("filename") ~
      get[String]("content") ~
      get[Date]("timestamp") map {
        case id ~ bucketId ~ filename ~ content ~ timestamp =>
          Dump(id, Bucket.byId(bucketId).get, filename, content, new DateTime(timestamp))
      }
  }
}