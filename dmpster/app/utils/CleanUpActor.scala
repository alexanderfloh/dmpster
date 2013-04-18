package utils

import akka.actor.Actor
import akka.actor.ActorLogging
import org.joda.time.DateTime
import play.api._
import Play.current
import models.Dump
import models.Tag

case class CleanUp()

class CleanUpActor extends Actor {
  def receive = {
    case CleanUp => {
      Logger.info("starting clean up")
      val oldTag = Tag.findOrCreate("marked for deletion")
      val keepForeverTag = Tag.findOrCreate("keep forever")

      deleteMarkedDumps(oldTag, keepForeverTag)
      
      markOldDumps(oldTag, keepForeverTag)
    }
  }

  private def dateForOldness = Play.mode match {
    case Mode.Dev => DateTime.now().minusSeconds(15)
    case Mode.Prod => DateTime.now().minusDays(14)
  }

  private def deleteMarkedDumps(oldTag: Tag, keepForeverTag: Tag) = {
    val dumpsToKeepForever = Dump.byTag(keepForeverTag)
    val oldDumpsToDelete = Dump.byTag(oldTag).filterNot(dumpsToKeepForever.contains(_))

    Logger.info("deleting " + oldDumpsToDelete.size + " dumps")
    val dmpPath = Play.current.configuration.getString("dmpster.dmp.path")
    oldDumpsToDelete.foreach(dump => {
      dmpPath.map(new java.io.File(_, dump.filename).delete)
        .getOrElse(Logger.warn("dmpster.dmp.path not set - unable to delete dmp file"))
      Dump.delete(dump.id)
    })
  }

  private def markOldDumps(oldTag: Tag, keepForeverTag: Tag) = {
    val oldDumps = Dump.olderThan(dateForOldness)

    val dumpsToMark = oldDumps.filterNot(dump => {
      val tags = Tag.forDump(dump)
      tags.contains(oldTag) || tags.contains(keepForeverTag)
    })
    Logger.info("marking " + dumpsToMark.size + " as old")
    dumpsToMark.foreach(dump => Dump.addTag(dump, oldTag))
  }
}