package controllers

import java.io.File
import scala.Array.canBuildFrom
import scala.concurrent.Await
import scala.concurrent.Future
import scala.concurrent.duration.Duration
import scala.concurrent.duration.DurationInt
import scala.language.postfixOps
import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import akka.pattern.ask
import akka.util.Timeout
import models.Bucket
import models.Dump
import models.Tag
import models.TagParser
import play.Logger
import play.api.Play
import play.api.libs.Files.TemporaryFile
import play.api.libs.concurrent.Akka
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.json.JsObject
import play.api.libs.json.Json
import play.api.libs.json.Json.toJsFieldJsValueWrapper
import play.api.libs.json.Json.toJson
import play.api.mvc.Action
import play.api.mvc.Controller
import play.api.mvc.MultipartFormData
import play.api.mvc.Request
import utils.Work
import utils.BucketsCacheAccess
import models.BucketHit
import javax.inject.Inject
import play.api.cache.CacheApi
import utils.BucketsCacheAccess
import akka.actor.ActorSystem
import javax.inject.Named
import akka.actor.ActorRef
import play.api.libs.json.JsValue
import models._

class Application @Inject() (
  bucketDb: BucketDB,
  bucketHitDb: BucketHitDb,
  dumpDb: DumpDB,
  tagDb: TagDB,
  bucketJsonWriter: BucketJsonWriter,
  dumpJsonWriter: DumpJsonWriter,
  @Named("analyze-master") analyzeMaster: ActorRef,
  @Named("websocket-master") websocketMaster: ActorRef
  ) extends Controller {

  def index = Action {
    Redirect(routes.Application.dmpster)
  }
  
  def dmpster = Action {
    val bucketsWithNewDumps = fetchGroupedBuckets.filter { case (_, dumps) => {
      dumps.exists { _.isNew }
    }}
    val dumps = bucketsWithNewDumps.flatMap{ case (_, d) => d }
    
    val tagsForDumps = tagDb.idsForDumps(dumps)
    val allTagIdsForDumps = tagsForDumps.flatMap { case (_, tagIds) => tagIds }.toList.distinct
    val allTags = tagDb.byIds(allTagIdsForDumps).groupBy(_.id)
    
    val tagsByDumpId = tagsForDumps.map { case (dumpId, tagIds) => (dumpId, tagIds.flatMap(allTags.get(_)).flatten) }
    implicit val dumpWrites = DumpJsonWriterNoDb(tagsByDumpId).writeForIndex
    
    val json = Json.obj(
      "analyzing" -> analyzingToJson(analyzing),
//          "analyzing" -> toJson(List("c.dmp")),
      //"buckets" -> bucketsToJson(cache.getBucketsOrElse(fetchGroupedBuckets)))
      "buckets" -> bucketsToJson(bucketsWithNewDumps),
      "dumps" -> toJson(dumps)
    )
    
    Ok(views.html.index(tagDb.all, json.toString))
  }
  
  def bucketsNewestJson = {
    Action {
      Ok(bucketHitDb.newest.toString)
    }
  }

  private def bucketsToJson(buckets: Bucket.GroupedBuckets) = {
    val bucketsOnly = buckets.map { case (bucket, _) => bucket }
    val tagIdsForBuckets = tagDb.idsForBuckets(bucketsOnly)
    
    val allTagIdsForBuckets = tagIdsForBuckets.flatMap { case (_, tagIds) => tagIds }.toList.distinct
    
    val dumpsOnly = buckets.flatMap { case (_, dumps) => dumps }
    val tagsForDumps = tagDb.idsForDumps(dumpsOnly)
    val allTagIdsForDumps = tagsForDumps.flatMap { case (_, tagIds) => tagIds }.toList.distinct
    val allTags = tagDb.byIds(allTagIdsForDumps ++ allTagIdsForBuckets).groupBy(_.id)
    
    val tagsByBucketId = tagIdsForBuckets.map { case (bucketId, tagIds) => (bucketId, tagIds.flatMap(allTags.get(_)).flatten) }
    val tagsByDumpId = tagsForDumps.map { case (dumpId, tagIds) => (dumpId, tagIds.flatMap(allTags.get(_)).flatten) }
    
    val bucketHits = bucketHitDb.forBuckets(bucketsOnly)

    implicit val dumpWrites = DumpJsonWriterNoDb(tagsByDumpId).writeForIndex
    implicit val bucketWrites = BucketDumpsJsonWriterNoDb(tagsByBucketId, bucketHits).jsonWriter
    implicit val bucketHitWrites = BucketHit

    toJson(buckets)
  }
  
  private def analyzingToJson(analyzing: List[File]): JsValue = {
    toJson(analyzing.map(_.getName))
  }
  
  private def fetchGroupedBuckets = dumpDb.forBucketsNoContent(bucketDb.bucketsSortedByDate2())

  def bucketsJson = {
    def generateResponse() = {
    	val buckets = bucketDb.bucketsSortedByDate2()
    	// TODO: get rid of this
    	val groupedBuckets = dumpDb.forBucketsNoContent(buckets)/*.filter { case (_, dumps) => {
        dumps.exists { _.isNew }
      }}*/
      val tagIdsForBuckets = tagDb.idsForBuckets(buckets)
    
      val allTagIdsForBuckets = tagIdsForBuckets.flatMap { case (_, tagIds) => tagIds }.toList.distinct
      
      val dumps = dumpDb.forBucketsNoContentAsList(buckets)
      val tagsForDumps = tagDb.idsForDumps(dumps)
      val allTagIdsForDumps = tagsForDumps.flatMap { case (_, tagIds) => tagIds }.toList.distinct
      val allTags = tagDb.byIds(allTagIdsForDumps ++ allTagIdsForBuckets).groupBy(_.id)
      
      val bucketHits = bucketHitDb.forBuckets(buckets)
      
      val tagsByBucketId = tagIdsForBuckets.map { case (bucketId, tagIds) => (bucketId, tagIds.flatMap(allTags.get(_)).flatten) }
      val tagsByDumpId = tagsForDumps.map { case (dumpId, tagIds) => (dumpId, tagIds.flatMap(allTags.get(_)).flatten) }
      
      implicit val dumpWrites = DumpJsonWriterNoDb(tagsByDumpId).writeForIndex
      implicit val bucketWrites = BucketDumpsJsonWriterNoDb(tagsByBucketId, bucketHits).jsonWriter
      implicit val bucketHitWrites = BucketHit
      
      Json.obj(
        "analyzing" -> analyzingToJson(analyzing),
//          "analyzing" -> toJson(List("a.dmp", "b.dmp")),
      //"buckets" -> bucketsToJson(cache.getBucketsOrElse(fetchGroupedBuckets)))
        "buckets" -> toJson(groupedBuckets),
        "dumps" -> toJson(dumps)
      )
    }
    
    Action {
      //Ok(cache.getOrElse(generateResponse))
      Ok(generateResponse)
    }
  }

  def updateBucketNotes(id: Long) = Action { request =>
    request.body.asText.map{ text =>
    	bucketDb.byId(id).map { bucket =>
        bucketDb.updateNotes(id, text)
        val updatedBucket = bucket.copy(notes = text)
        val tags = tagDb.forBucket(updatedBucket)
        val bucketHits = bucketHitDb.forBuckets(List(updatedBucket))
        val dumps = dumpDb.byBucket(updatedBucket)
        websocketMaster ! UpdateBucket(updatedBucket, dumps, BucketDumpsJsonWriterNoDb(Map((updatedBucket.id, tags)), bucketHits).jsonWriter)
        
        Ok("")
    	}.getOrElse { 
    	  NotFound(s"bucket with id $id was not found") 
  	  }
    }.getOrElse {
      Logger.warn(s"POST update notes without notes argument: ${request.body.asText}")
      BadRequest("no notes specified")
    }
  }

  def detailsJson(id: Long) = Action {
    implicit val dumpWrites = dumpJsonWriter.writeForDetails
    val optResult = for {
      dump <- dumpDb.byId(id)
    } yield Ok(toJson(dump))
    optResult.getOrElse(BadRequest(s"Dump ${id} not found"))
  }

  def viewDetails(id: Long) = Action {
    val optResult = for {
      dump <- dumpDb.byId(id)
    } yield Ok(views.html.details(dump.bucket, dump))
    optResult.getOrElse(BadRequest(s"Dump ${id} not found"))
  }

  def viewBucket(id: Long) = Action {
    val result = for {
      bucket <- bucketDb.byId(id)
      dumps = dumpDb.byBucket(bucket)
    } yield Ok(views.html.viewBucket(bucket, dumps, List()))

    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def bucketJson(id: Long) = Action {
    implicit val bucketWrites = bucketJsonWriter.jsonWriter
    implicit val dumpWrites = dumpJsonWriter.writeForIndex

    val result = for {
      bucket <- bucketDb.byId(id)
      dumps = dumpDb.byBucket(bucket)
    } yield Ok(Json.obj("bucket" -> toJson(bucket), "dumps" -> toJson(dumps)))

    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def bucketHitsJson(id: Long) = Action {
    Ok(toJson(bucketHitDb.byBucket(id).foldLeft(Json.obj()) {
      case (json, (time, count)) => json + (time.toString, toJson(count))
    }))
  }

  def analyzing: List[File] = {
    implicit val timeout = Timeout(15 seconds)
    val jobs = analyzeMaster ? utils.QueryRunningJobs
    val files = Await.result(jobs.mapTo[utils.RunningJobs], Duration.Inf).jobs
    files
  }

  def addTagToDmp(id: Long, tagName: String) = Action {
    val tag = tagDb.findOrCreate(tagName)

    dumpDb.byId(id).map(dump => {
      val tags = tagDb.forDump(dump)
      if (!tags.exists(_.name == tagName)) { 
        dumpDb.addTag(dump, tag)
        websocketMaster ! UpdateDump(dump, DumpJsonWriterNoDb(Map((dump.id, tags :+ tag))).writeForIndex)
      }
      Ok("tag added")
    }).getOrElse(NotFound(s"Invalid dump id ${id}"))
  }

  def removeTagFromDmp(id: Long, tagName: String) = Action {
    tagDb.findByName(tagName).flatMap(tag => {
      dumpDb.byId(id).map(dump => {
        dumpDb.removeTag(dump, tag)
        val tags = tagDb.forDump(dump)
        websocketMaster ! UpdateDump(dump, DumpJsonWriterNoDb(Map((dump.id, tags))).writeForIndex)
        Ok("tag removed")
      })
    }).getOrElse(NotFound("Invalid dump id or tag"))
  }

  def addTagToBucket(id: Long, tagName: String) = Action {
    val tag = tagDb.findOrCreate(tagName)
    val result = for { bucket <- bucketDb.byId(id) } yield {
      val tags = tagDb.forBucket(bucket)
      if (!tags.exists(_.name == tagName)) {
        bucketDb.addTag(bucket, tag)
        val bucketHits = bucketHitDb.forBuckets(List(bucket))
        val dumps = dumpDb.byBucket(bucket)
        websocketMaster ! UpdateBucket(bucket, dumps, BucketDumpsJsonWriterNoDb(Map((bucket.id, tags :+ tag)), bucketHits).jsonWriter)
      }
      Ok("tag added")
    }
    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def removeTagFromBucket(id: Long, tagName: String) = Action {
    val tag = tagDb.findOrCreate(tagName)
    val result = for (bucket <- bucketDb.byId(id)) yield {
      bucketDb.removeTag(bucket, tag)
      val tags = tagDb.forBucket(bucket)
      val bucketHits = bucketHitDb.forBuckets(List(bucket))
      val dumps = dumpDb.byBucket(bucket)
      websocketMaster ! UpdateBucket(bucket, dumps, BucketDumpsJsonWriterNoDb(Map((bucket.id, tags)), bucketHits).jsonWriter)
      Ok("tag removed")
    }
    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

}
