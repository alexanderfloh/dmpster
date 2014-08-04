package utils

import akka.actor.Actor
import akka.actor.ActorLogging
import org.joda.time.DateTime
import play.api._
import Play.current
import models.Dump
import models.Tag
import models.Bucket

case class CleanUp()

class CleanUpActor extends Actor {

  lazy val maxNumberOfDumpsPerBucket = Play.current.configuration.getInt("dmpster.max.number.of.dmps.per.bucket").getOrElse(5)

  lazy val oldTag = Tag.findOrCreate("marked for deletion")
  lazy val keepForeverTag = Tag.findOrCreate("keep forever")

  def receive = {
    case CleanUp => {
      Logger.debug("starting clean up")

      deleteMarkedDumps
      markOldDumps
      limitNumberOfDumpsPerBucket
    }
  }

  def dateForOldness = Play.mode match {
    case Mode.Dev => DateTime.now.minusMinutes(15)
    case Mode.Prod => DateTime.now.minusDays(14)
  }

  def deleteSingleDump(dmpPath: String, dump: Dump) {
    import java.io.File
    import java.nio.file.Paths

    new File(dmpPath, dump.relFilePath).delete
    var currentRelDir = Paths.get(dump.relFilePath).getParent()
    while (currentRelDir != null) {
      new File(dmpPath, currentRelDir.toString()).delete
      currentRelDir = currentRelDir.getParent()
    }
  }

  def limitNumberOfDumpsPerBucket = {
    import Joda._

    val dumpsByBucket = for {
      bucket <- Bucket.all
      dumps = Dump.byBucket(bucket)
      if (dumps.length > maxNumberOfDumpsPerBucket)
    } yield (bucket, dumps.sortBy(_.timestamp).reverse)

    dumpsByBucket.foreach {
      case (bucket, dumps) => {
        val dumpsToDeleteCount = dumps.length - maxNumberOfDumpsPerBucket
        val dumpsToDelete = dumps.filterNot(dump => dump.tags.contains(keepForeverTag)).take(dumpsToDeleteCount)
        
        if (!dumpsToDelete.isEmpty) Logger.info(s"marking ${dumpsToDelete.length} Dmps from Bucket '${bucket.name}' for deletion")

        markForDeletion(dumpsToDelete)
      }
    }
  }

  def markForDeletion(dump: Dump): Unit = {
    if (!dump.tags.contains(oldTag))
      Dump.addTag(dump, oldTag)
  }

  def markForDeletion(dumps: List[Dump]): Unit = dumps.foreach(markForDeletion)

  def deleteMarkedDumps = {
    val dumpsToKeepForever = Dump.byTag(keepForeverTag)
    val oldDumpsToDelete = Dump.byTag(oldTag).filterNot(dumpsToKeepForever.contains(_))

    if (!oldDumpsToDelete.isEmpty) Logger.info(s"deleting ${oldDumpsToDelete.size} dumps")

    val dmpPath = Play.current.configuration.getString("dmpster.dmp.path")
    oldDumpsToDelete.foreach(dump => {
      dmpPath.map(deleteSingleDump(_, dump))
        .getOrElse(Logger.warn("dmpster.dmp.path not set - unable to delete dmp file"))
      Dump.delete(dump.id)
    })
  }

  def markOldDumps = {
    val oldDumps = Dump.olderThan(dateForOldness)

    val dumpsToMark = oldDumps.filterNot(dump => {
      val tags = Tag.forDump(dump)
      tags.contains(oldTag) || tags.contains(keepForeverTag)
    })

    if (!dumpsToMark.isEmpty) Logger.info(s"marking ${dumpsToMark.size} as old")
    markForDeletion(dumpsToMark)
  }
}