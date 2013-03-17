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
import org.joda.time.DateTime
import scala.collection.immutable.ListMap

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
    val allDumpsByBucket = groupedByBucket.map{case (bucket, _) =>
    	(bucket, Dump.byBucket(bucket).sortBy(_.timestamp))
    }
    val json = toJson(allDumpsByBucket.map{case (bucket, dumps) =>
    	(bucket.id.toString, views.html.bucket(bucket, dumps).body)
    })
    
    Ok(json)
  }

  def viewDetails(id: Long) = Action {
    Dump.byId(id)
      .map(dump => views.html.details(dump))
      .map(Ok(_)).getOrElse(BadRequest("dump not found"))
  }

  def uploadAjax = Action(parse.multipartFormData) {
    Logger.info("upload")
    request => request.body.file("file").map { dmp =>
      Logger.info("moving file " + dmp.filename)
      import java.io.File
      val filename = dmp.filename
      val contentType = dmp.contentType
      val dir = new File("public/dmps")
      dir.mkdirs()
      val newFile = new File(dir, filename)
      dmp.ref.moveTo(newFile, true)

      Logger.info("parsing DMP")
      val futureResult = Akka.future { DmpParser(newFile).parse }
      Async {
        futureResult.map{case (bucketName, content) => 
          val bucket = Bucket.findOrCreate(bucketName)

          Dump.create(bucket, filename, content)
          Ok(toJson(Map("status" -> "OK")))
        }
      }
    }.getOrElse {
      Logger.warn("file missing")
      Redirect(routes.Application.index).flashing(
        "error" -> "Missing file")
    }
  }

  def addTagToDmp(id: Long, tagName: String) = Action {
    val tag = Tag.findByName(tagName).getOrElse({
      Tag.create(tagName)
      Tag.findByName(tagName).get
    })

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