package controllers

import java.io.File

import scala.Array.canBuildFrom
import scala.annotation.implicitNotFound
import scala.concurrent.Await
import scala.concurrent.Future
import scala.concurrent.duration.Duration
import scala.concurrent.duration.DurationInt
import scala.language.postfixOps

import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat

import akka.pattern.ask
import akka.util.Timeout
import akka.util.Timeout.durationToTimeout
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
import play.api.libs.json.Json.toJson
import play.api.libs.json._
import play.api.mvc.Action
import play.api.mvc.Controller
import play.api.mvc.MultipartFormData
import play.api.mvc.Request
import utils.Joda.dateTimeOrdering
import utils.Work

object Application extends Controller {

  def index = Action {
    Redirect(routes.Application.dmpster)
  }

  def dmpster = Action {
    Ok(views.html.index(Dump.groupDumpsByBucket(Dump.all), Tag.all))
  }

  def bucketsJson = Action {
    import Bucket.format
    import Tag.format
    implicit val dumpWrites = Dump.writeForIndex
    //implicit val writes = Json.writes[List[(Bucket, List[Dump])]]
    val grouped = Dump.groupDumpsByBucket2(Dump.all)
    val contentJsonified = toJson(grouped.map { case (bucket, dumps) => 
      Seq(toJson(bucket), toJson(dumps))
    })
    Ok(Json.obj(
        "analyzing" -> analyzingJson,
        "buckets" -> contentJsonified))
  }

  def newerThan(timestamp: Long) = Action {
    import utils.Joda._

    val time = new DateTime(timestamp)
    val newDumps = Dump.newerThan(time)
    val groupedByBucket = newDumps.groupBy(_.bucket)
    val allDumpsByBucket = groupedByBucket.map {
      case (bucket, _) =>
        (bucket, Dump.byBucket(bucket).sortBy(_.timestamp))
    }
    val json = toJson(allDumpsByBucket.map {
      case (bucket, dumps) =>
        (bucket.id.toString, views.html.bucket(bucket, dumps).body)
    })

    Ok(json)
  }

  def viewDetails(id: Long) = Action {
    val optResult = for {
      dump <- Dump.byId(id)
    } yield Ok(views.html.details(dump))
    optResult.getOrElse(BadRequest(s"Dump ${id} not found"))
  }

  def viewBucket(id: Long) = Action {
    val result = for {
      bucket <- Bucket.byId(id)
      dumps = Dump.byBucket(bucket)
    } yield Ok(views.html.viewBucket(bucket, dumps, List()))

    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def analyzing = Action {
    val analyzer = Akka.system.actorSelection("/user/analyzeMaster")
    implicit val timeout = Timeout(5 seconds)
    val jobs = analyzer ? utils.QueryRunningJobs
    val files = Await.result(jobs.mapTo[utils.RunningJobs], Duration.Inf).jobs
    Ok(toJson(views.html.processing(files.map(_.getName)).body.trim))
  }
  
  def analyzingJson = {
    val analyzer = Akka.system.actorSelection("/user/analyzeMaster")
    implicit val timeout = Timeout(5 seconds)
    val jobs = analyzer ? utils.QueryRunningJobs
    val files = (Await.result(jobs.mapTo[utils.RunningJobs], Duration.Inf).jobs :+ new java.io.File("foo.dmp"))
    
    toJson(files.map(_.getName))
  }

  def upload = Action(parse.multipartFormData) {
    request =>
      {
        val futureResults = handleUpload(request)
        val result = Await.result(futureResults, Duration.Inf)
        Ok(toJson(Map("files" -> toJson(result))))
      }
  }

  def uploadAsync = Action(parse.multipartFormData) {
    request =>
      {
        handleUpload(request)
        Ok(toJson(Map("files" -> "")))
      }
  }

  private def createDumpSubDirName =
    DateTime.now.toString(DateTimeFormat.forPattern("yyyy-MM-dd_HH-mm-ss_SSS"))

  type MultiPartRequest = Request[MultipartFormData[TemporaryFile]]
  type FilePart = MultipartFormData.FilePart[TemporaryFile]

  def extractTagsFrom(request: MultiPartRequest) = {
    request.body.dataParts.get("tags").map { tags =>
      tags.head.split(",").map { case TagParser(t) => t }
    }
  }

  def moveFile(dmp: FilePart) = {
    Logger.info(s"moving file ${dmp.filename}")
    import java.io.File

    val dmpPath = Play.current.configuration.getString("dmpster.dmp.path").getOrElse("dmps")
    val subDir = createDumpSubDirName
    val relFilePath = s"${subDir}${File.separator}${dmp.filename}"
    val dir = new File(dmpPath, subDir)
    dir.mkdirs()
    val newFile = new File(dir, dmp.filename)
    dmp.ref.moveTo(newFile, true)
    (newFile, dmp.filename, relFilePath)
  }

  private def handleUpload(request: MultiPartRequest) = {
    Logger.info("upload")
    val futureResults = Future.sequence(request.body.files.map { dmp =>

      val (newFile, filename, relFilePath) = moveFile(dmp)

      Logger.info("parsing DMP")
      val analyzer = Akka.system.actorSelection("/user/analyzeMaster")

      val futureResult = ask(analyzer, Work(newFile))(15 minutes).mapTo[utils.Result]

      for {
        utils.Result(file, bucketName, content) <- futureResult
        bucket = Bucket.findOrCreate(bucketName)
        dump = Dump.create(bucket, relFilePath, content)

      } yield {
        extractTagsFrom(request).map { tags => tags.foreach(tagName => Dump.addTag(dump, tagName))
        }.getOrElse(Logger.info("no tags provided"))

        toJson(Map {
          "name" -> toJson(filename)
          "url" -> toJson(s"/dmpster/dmp/${dump.id}/details")
        })
      }

    })
    futureResults
  }

  def addTagToDmp(id: Long, tagName: String) = Action {
    val tag = Tag.findOrCreate(tagName)

    Dump.byId(id).map(dump => {
      if (!Tag.forDump(dump).exists(_.name == tagName)) Dump.addTag(dump, tag)
      Ok(views.html.listTags(dump))
    }).getOrElse(NotFound(s"Invalid dump id ${id}"))
  }

  def removeTagFromDmp(id: Long, tagName: String) = Action {
    Tag.findByName(tagName).flatMap(tag => {
      Dump.byId(id).map(dump => {
        Dump.removeTag(dump, tag)
        Ok(views.html.listTags(dump))
      })
    }).getOrElse(NotFound("Invalid dump id or tag"))
  }

  def addTagToBucket(id: Long, tagName: String) = Action {
    val tag = Tag.findOrCreate(tagName)
    val result = for { bucket <- Bucket.byId(id) } yield {
      if (Tag.forBucket(bucket).exists(_.name == tagName))
        Ok(views.html.listTags(bucket))
      else {
        Bucket.addTag(bucket, tag)
        Ok(views.html.listTags(bucket))
      }
    }
    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def removeTagFromBucket(id: Long, tagName: String) = Action {
    val tag = Tag.findOrCreate(tagName)
    val result = for (bucket <- Bucket.byId(id)) yield {
      Bucket.removeTag(bucket, tag)
      Ok(views.html.listTags(bucket))
    }
    result.getOrElse(NotFound(s"Bucket ${id} not found"))
  }

  def deleteBucket(id: Long) = TODO

}
