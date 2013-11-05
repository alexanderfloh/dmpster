package controllers

import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import play.api.libs.json.Json._
import models.Dump
import scala.io.Source
import play.api.libs.concurrent._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.Play.current
import utils.DmpParser
import play.Logger
import models.Tag
import models.Bucket
import scala.collection.immutable.ListMap
import org.joda.time.DateTime
import akka.pattern.ask
import utils.Work
import scala.concurrent.Await
import scala.concurrent.duration._
import scala.concurrent.Future
import akka.util.Timeout
import play.api.libs.Files.TemporaryFile

object Application extends Controller {

  def index = Action {
    Redirect(routes.Application.dmpster)
  }

  def dmpster = Action {
    Ok(views.html.index(Dump.groupDumpsByBucket(Dump.all), Tag.all))
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
    optResult.getOrElse(BadRequest("dump not found"))
  }

  def analyzing = Action {
    val analyzer = Akka.system.actorFor("/user/analyzeMaster")
    implicit val timeout = Timeout(5 seconds)
    val jobs = analyzer ? utils.QueryRunningJobs
    val files = Await.result(jobs.mapTo[utils.RunningJobs], Duration.Inf).jobs
    Ok(toJson(views.html.processing(files.map(_.getName)).body.trim))
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

  private def handleUpload(request: Request[MultipartFormData[TemporaryFile]]) = {
    Logger.info("upload")
    val futureResults =
      Future.sequence(request.body.files.map { dmp =>

        def moveFile(dmp: MultipartFormData.FilePart[TemporaryFile]) = {
          Logger.info("moving file " + dmp.filename)
          import java.io.File

          val dmpPath = Play.current.configuration.getString("dmpster.dmp.path").getOrElse("dmps")
          val dir = new File(dmpPath)
          dir.mkdirs()
          val newFile = new File(dir, dmp.filename)
          dmp.ref.moveTo(newFile, true)
          (newFile, dmp.filename)
        }

        val (newFile, filename) = moveFile(dmp)

        Logger.info("parsing DMP")
        val analyzer = Akka.system.actorFor("/user/analyzeMaster")

        val futureResult = ask(analyzer, Work(newFile))(5 minutes).mapTo[utils.Result]

        val response = futureResult.map {
          case utils.Result(file, bucketName, content) =>
            val bucket = Bucket.findOrCreate(bucketName)

            val dump = Dump.create(bucket, filename, content)

            def extractTagsFrom(request: Request[MultipartFormData[TemporaryFile]]) = {
              request.body.dataParts.get("tags").map { tags =>
                tags.head.split(",")
                  .map(_.trim)
                  .filter(!_.isEmpty())
              }
            }

            extractTagsFrom(request).map { tags =>
              tags.foreach(tagName => Dump.addTag(dump, Tag.findOrCreate(tagName)))
            }.getOrElse(Logger.info("no tags provided"))

            toJson(Map("name" -> toJson(filename),
              "url" -> toJson("/dmpster/dmp/" + dump.id + "/details")))
        }
        response
      })
    futureResults
  }

  def addTagToDmp(id: Long, tagName: String) = Action {
    val tag = Tag.findOrCreate(tagName)

    Dump.byId(id).map(dump =>
      if (Tag.forDump(dump).exists(_.name == tagName))
        Ok(views.html.listTags(dump))
      else {
        Dump.addTag(dump, tag)
        Ok(views.html.listTags(dump))
      }).getOrElse(BadRequest("Invalid dump id"))
  }

  def removeTagFromDmp(id: Long, tagName: String) = Action {
    Tag.findByName(tagName).flatMap(tag => {
      Dump.byId(id).map(dump => {
        Dump.removeTag(dump, tag)
        Ok(views.html.listTags(dump))
      })
    }).getOrElse(BadRequest("Invalid dump id or tag"))
  }

  def addTagToBucket(id: Long, tagName: String) = Action {
    val tag = Tag.findByName(tagName).getOrElse({
      Tag.create(tagName)
      Tag.findByName(tagName).get
    })

    val bucket = Bucket.byId(id)
    if (Tag.forBucket(bucket).exists(_.name == tagName))
      Ok(views.html.listTags(bucket))
    else {
      Bucket.addTag(bucket, tag)
      Ok(views.html.listTags(bucket))
    }
  }

  def removeTagFromBucket(id: Long, tagName: String) = Action {
    Tag.findByName(tagName).map(tag => {
      val bucket = Bucket.byId(id)
      Bucket.removeTag(bucket, tag)
      Ok(views.html.listTags(bucket))

    }).getOrElse(BadRequest("Invalid tag"))
  }

  def deleteBucket(id: Long) = TODO

}
