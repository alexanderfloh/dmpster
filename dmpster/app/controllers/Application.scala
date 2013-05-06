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
    Logger.info("currently analyzing " + files.mkString(", "))
    Ok(toJson(views.html.processing(files.map(_.getName)).body.trim))
  }

  def uploadAjax = Action(parse.multipartFormData) {
    Logger.info("upload")
    request => request.body.file("file").map { dmp =>
      Logger.info("moving file " + dmp.filename)
      import java.io.File
      val filename = dmp.filename
      val contentType = dmp.contentType
      val dmpPath = Play.current.configuration.getString("dmpster.dmp.path").getOrElse("dmps")
      val dir = new File(dmpPath)
      dir.mkdirs()
      val newFile = new File(dir, filename)
      dmp.ref.moveTo(newFile, true)

      Logger.info("parsing DMP")
      val analyzer = Akka.system.actorFor("/user/analyzeMaster")

      val futureResult = ask(analyzer, Work(newFile))(5 minutes).mapTo[utils.Result]
      //val futureResult = Akka.future { DmpParser(newFile).parse }

      val response = futureResult.map {
        case utils.Result(file, bucketName, content) =>
          val bucket = Bucket.findOrCreate(bucketName)

          val dump = Dump.create(bucket, filename, content)

          request.body.dataParts.get("tags").map { tags =>
            tags.head.split(",")
              .map(_.trim)
              .filter(!_.isEmpty())
              .foreach(tagName => {
                val tag = Tag.findOrCreate(tagName)
                Dump.addTag(dump, tag)
              })

          }.getOrElse(Logger.info("no tags provided"))

          Ok(toJson(Map("status" -> "OK")))
      }

      Await.result(response, Duration.Inf)
    }.getOrElse {
      Logger.warn("file missing")
      Redirect(routes.Application.index).flashing(
        "error" -> "Missing file")
    }
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
