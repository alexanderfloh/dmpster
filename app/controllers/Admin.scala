package controllers

import play.api._
import play.api.mvc._
import play.api.libs._
import play.api.libs.iteratee._
import play.api.libs.concurrent.Akka
import akka.actor.Props
import utils.{ CleanUpActor, CleanUp }
import java.text.DecimalFormat
import java.io.File
import models.Dump
import javax.inject.Inject
import akka.actor.ActorSystem
import javax.inject.Named
import akka.actor.ActorRef

class Admin @Inject() (
    configuration: Configuration,
    @Named("clean-up-actor") cleanUpActor: ActorRef) extends Controller {
  def index = Action {
    val dmpPath = configuration.getString("dmpster.dmp.path").getOrElse("dmps")
    val filePath = new File(dmpPath)
    val totalSpace = filePath.getTotalSpace
    val freeSpace = filePath.getFreeSpace
    
    val referencedFiles = Dump.all.map(_.pathInStorageDirectory)
    
    def getActualFiles(filePath: File): List[File] = {
      val all = filePath.listFiles().toList
      val files = all.filterNot(_.isDirectory)
      val dirs = all.filter(_.isDirectory)
      val subfiles = dirs.flatMap(getActualFiles(_))
      files ++ subfiles
    }
    val referencedFilesAbsolute = referencedFiles.map(f => new File(filePath, f)).map(_.getPath)
    val danglingFiles = getActualFiles(filePath).map(_.getPath).filterNot { f => referencedFilesAbsolute.contains(f) }

    Ok(views.html.admin(totalSpace, freeSpace, formatFileSize(totalSpace), formatFileSize(freeSpace), danglingFiles))
  }

  def cleanUpNow = Action {
    Logger.info("clean up requested")
    cleanUpActor ! CleanUp
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