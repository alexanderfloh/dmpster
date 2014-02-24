package controllers

import play.api._
import play.api.mvc._
import play.api.libs._
import play.api.libs.iteratee._
import Play.current
import play.api.libs.concurrent.Akka
import akka.actor.Props
import utils.{ CleanUpActor, CleanUp }
import java.text.DecimalFormat

object Admin extends Controller {
  def index = Action {
    val dmpPath = Play.current.configuration.getString("dmpster.dmp.path").getOrElse("dmps")
    val filePath = new java.io.File(dmpPath)
    val totalSpace = filePath.getTotalSpace
    val freeSpace = filePath.getFreeSpace

    Ok(views.html.admin(totalSpace, freeSpace, formatFileSize(totalSpace), formatFileSize(freeSpace)))
  }

  def cleanUpNow = Action {
    Logger.info("clean up requested")
    val actor = Akka.system.actorSelection("/user/cleanUpActor")
    actor ! CleanUp
    Redirect(routes.Admin.index)
  }

  private def formatFileSize(size: Long) = {
    if (size <= 0) "0"
    else {
      val units = List("B", "KB", "MB", "GB", "TB")
      val digitGroups = (Math.log10(size) / Math.log10(1024)).toInt
      s"${new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups))} ${units(digitGroups)}"
    }
  }
}