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
import play.api.Play.current
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
import utils.BucketsAsJsonCacheAccess
import models.BucketHit

object Application extends Controller {

  def index = Action {
    Redirect(routes.Application.dmpster)
  }

  def dmpster = Action {
    Ok(views.html.index(Tag.all, bucketsAsJson.toString))
  }

  def search(search: String) = Action {
    Ok(views.html.search(search, Tag.all, searchBucketsAsJson(search).toString))
  }

  val emptyResponse = Json.obj("analyzing" -> List[String](), "buckets" -> List[String]())

  private def bucketsAsJson = {
    implicit val bucketWrites = Bucket.jsonWriter
    implicit val dumpWrites = Dump.writeForIndex

    val grouped = Dump.forBucketsNoContent(Bucket.bucketsSortedByDate2()) 
    val contentJsonified = toJson(grouped.map {
      case (bucket, dumps) =>
        Seq(toJson(bucket), toJson(dumps))
    })
    Json.obj(
      "analyzing" -> analyzingJson,
      "buckets" -> contentJsonified)
  }

  def bucketsNewestJson = {
    Action {
      Ok(BucketHit.newest.toString)
    }
  }

  def bucketsJson = {
    Action {
      Ok(BucketsAsJsonCacheAccess.getOrElse(120) { bucketsAsJson })
    }
  }

  private def searchBucketsAsJson(search: String) = {
    if (search.length >= 3 && search.head == '[' && search.last == ']') {
      val searchResult = Tag.findByName(search.drop(1).dropRight(1)).map { tag =>
        val dumps = Dump.byTag(tag)
        val grouped = Dump.groupDumpsByBucket(dumps)

        implicit val bucketWrites = Bucket.jsonWriter
        implicit val dumpWrites = Dump.writeForIndex

        val contentJsonified = toJson(grouped.map {
          case (bucket, dumps) =>
            Seq(toJson(bucket), toJson(dumps))
        })
        Json.obj(
          "analyzing" -> analyzingJson,
          "buckets" -> contentJsonified)

      }.getOrElse(emptyResponse)
      searchResult
    } else {
      emptyResponse
    }
  }

  def searchBucketsJson(search: String) = Action {
    Ok(searchBucketsAsJson(search))
  }

  def updateBucketNotes(id: Long) = Action { request =>
    request.body.asFormUrlEncoded.map(m => {
      val notes = m("notes")
      Logger.info(notes.toString)
      Bucket.updateNotes(id, notes.headOption.getOrElse(""))
      BucketsAsJsonCacheAccess.invalidateCache()
      Ok("")
    }).getOrElse {
      BadRequest("no notes specified")
    }
  }

  def detailsJson(id: Long) = Action {
    implicit val dumpWrites = Dump.writeForDetails
    val optResult = for {
      dump <- Dump.byId(id)
    } yield Ok(toJson(dump))
    optResult.getOrElse(BadRequest(s"Dump ${id} not found"))
  }

  def viewDetails(id: Long) = Action {
    val optResult = for {
      dump <- Dump.byId(id)
    } yield Ok(views.html.details(dump.bucket, dump))
    optResult.getOrElse(BadRequest(s"Dump ${id} not found"))
  }

  def viewBucket(id: Long) = Action {
    val result = for {
      bucket <- Bucket.byId(id)
      dumps = Dump.byBucket(bucket)
    } yield Ok(views.html.viewBucket(bucket, dumps, List()))

    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def bucketJson(id: Long) = Action {
    implicit val bucketWrites = Bucket.jsonWriter
    implicit val dumpWrites = Dump.writeForIndex

    val result = for {
      bucket <- Bucket.byId(id)
      dumps = Dump.byBucket(bucket)
    } yield Ok(Json.obj("bucket" -> toJson(bucket), "dumps" -> toJson(dumps)))

    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def bucketHitsJson(id: Long) = Action {
    Ok(toJson(BucketHit.byBucket(id).foldLeft(Json.obj()) {
      case (json, (time, count)) => json + (time.toString, toJson(count))
    }))
  }

  def analyzingJson = {
    val analyzer = Akka.system.actorSelection("/user/analyzeMaster")
    implicit val timeout = Timeout(5 seconds)
    val jobs = analyzer ? utils.QueryRunningJobs
    val files = Await.result(jobs.mapTo[utils.RunningJobs], Duration.Inf).jobs

    toJson(files.map(_.getName))
  }

  def addTagToDmp(id: Long, tagName: String) = Action {
    val tag = Tag.findOrCreate(tagName)

    Dump.byId(id).map(dump => {
      if (!Tag.forDump(dump).exists(_.name == tagName)) Dump.addTag(dump, tag)
      invalidateCache()
      Ok("tag added")
    }).getOrElse(NotFound(s"Invalid dump id ${id}"))
  }

  def removeTagFromDmp(id: Long, tagName: String) = Action {
    Tag.findByName(tagName).flatMap(tag => {
      Dump.byId(id).map(dump => {
        Dump.removeTag(dump, tag)
        invalidateCache()
        Ok("tag removed")
      })
    }).getOrElse(NotFound("Invalid dump id or tag"))
  }

  def addTagToBucket(id: Long, tagName: String) = Action {
    val tag = Tag.findOrCreate(tagName)
    val result = for { bucket <- Bucket.byId(id) } yield {
      if (!Tag.forBucket(bucket).exists(_.name == tagName)) {
        Bucket.addTag(bucket, tag)
        invalidateCache()
      }
      Ok("tag added")
    }
    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def removeTagFromBucket(id: Long, tagName: String) = Action {
    val tag = Tag.findOrCreate(tagName)
    val result = for (bucket <- Bucket.byId(id)) yield {
      Bucket.removeTag(bucket, tag)
      invalidateCache()
      Ok("tag removed")
    }
    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def invalidateCache() = BucketsAsJsonCacheAccess.invalidateCache()
}
