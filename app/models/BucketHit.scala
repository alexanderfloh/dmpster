package models

import org.joda.time.DateTime
import play.api.db._
import play.api.Play.current
import anorm._
import anorm.SqlParser._
import language.postfixOps
import play.api.libs.json._
import java.util.Date
import javax.inject.Inject

case class BucketHit(id: Long, bucketId: Long, dumpId: Option[Long], timestamp: DateTime) {

}

class BucketHitDb @Inject() (db: Database) {
  def byBucket(bucketId: Long) = db.withConnection { implicit c =>
    val hits = SQL"select * from bucket_hits where bucketId=$bucketId"
      .as(bucketHit *)
    hits.groupBy(h => h.timestamp.toLocalDate()).map {
      case (ts, items) => {
        (ts.toDate.getTime / 1000, items.length)
      }
    }
  }

  def newest() = db.withConnection { implicit c =>
    SQL"""SELECT * FROM bucket_hits 
          GROUP BY bucketId, id 
          ORDER BY timestamp DESC"""
      .as(bucketHit *)
  }

  def bucketHit = {
    get[Long]("id") ~
      get[Long]("bucketId") ~
      get[Option[Long]]("dumpId") ~
      get[Date]("timestamp") map {
        case id ~ bucketId ~ dumpId ~ timestamp => BucketHit(id, bucketId, dumpId, new DateTime(timestamp))
      }
  }

  val write = Writes[BucketHit] { d =>
    Json.obj(
      "id" -> d.id,
      "bucketId" -> d.bucketId,
      "dumpId" -> 0,
      "timestamp" -> d.timestamp)
  }
}