package controllers

import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import play.api.libs.json.Json._
import models.Bucket
import scala.io.Source
import play.api.libs.concurrent._
import play.api.Play.current
import utils.DmpParser
import play.Logger
import models.Tag

object Application extends Controller {

  def index = Action {
    Redirect(routes.Application.buckets)
  }

  def buckets = Action {
    Ok(views.html.index(Bucket.all.map(b => (b, Tag.tagsForBucket(b))), Tag.all))
  }

  def viewDetails(id: Long) = Action {
    Bucket.byId(id).map(b => views.html.details(b)).map(Ok(_)).getOrElse(Ok("not found"))
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
        futureResult.map(p => {
          Bucket.create(p._1, filename, p._2)
          Ok(toJson(Map("status" -> "OK")))
        })
      }
    }.getOrElse {
      Logger.warn("file missing")
      Redirect(routes.Application.index).flashing(
        "error" -> "Missing file")
    }
  }

  def addTag(id: Long, tagName: String) = Action {
    val tag = Tag.findByName(tagName).getOrElse({
      Tag.create(tagName)
      Tag.findByName(tagName).get
    })

    Bucket.byId(id).map(b =>
      if (Tag.tagsForBucket(b).exists(_.name == tagName)) Ok("tag already there")
      else {
        Bucket.addTag(b, tag)
        Ok(views.html.tags(b, Tag.tagsForBucket(b)))
      }).getOrElse(BadRequest("Invalid bucket id"))
  }
  
  def removeTag(id: Long, tagName: String) = Action {
    Tag.findByName(tagName).map (tag => {
       Bucket.byId(id).map(b => {
        Bucket.removeTag(b, tag)
        //Ok(views.html.tags(Tag.tagsForBucket(b)))
       })
       Ok("")
    }).getOrElse(BadRequest("Invalid bucket id or tag"))
  }

  def deleteBucket(id: Long) = TODO

}