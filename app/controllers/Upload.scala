package controllers

import java.io.File
import scala.concurrent.Await
import scala.concurrent.Future
import scala.concurrent.duration.Duration
import scala.concurrent.duration.DurationInt
import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import akka.pattern.ask
import akka.util.Timeout
import models.Bucket
import models.Dump
import models.TagParser
import play.api.Logger
import play.api.Play
import play.api.libs.Files.TemporaryFile
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.json.Json.toJson
import play.api.mvc.Action
import play.api.mvc.Controller
import play.api.mvc.MultipartFormData
import play.api.mvc.Request
import play.libs.Akka
import utils.Work
import javax.inject.Inject
import akka.actor.ActorSystem
import play.api.Configuration
import akka.actor.ActorRef
import javax.inject.Named
import utils.BucketsCacheAccess
import models.BucketDB
import models.DumpDB
import models.DumpJsonWriterNoDb
import models.TagDB
import models.BucketDumpsJsonWriterNoDb
import models.BucketHitDb


class Upload @Inject() (
  configuration: Configuration,
  bucketDb: BucketDB,
  bucketHitDb: BucketHitDb,
  dumpDb: DumpDB,
  tagDb: TagDB,
  tagParser: TagParser,
  @Named("analyze-master") analyzeMaster: ActorRef,
  @Named("websocket-master") websocketMaster: ActorRef    
) extends Controller {
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
      tags.head.split(",").map { case tagParser.Result(t) => t }
    }
  }

  private def moveFile(dmp: FilePart) = {
    Logger.info(s"moving file ${dmp.filename}")
    import java.io.File

    
    val dmpPath = configuration.getString("dmpster.dmp.path").getOrElse("dmps")
    val subDir = createDumpSubDirName
    val relFilePath = s"${subDir}${File.separator}${dmp.filename}"
    val dir = new File(dmpPath, subDir)
    dir.mkdirs()
    val newFile = new File(dir, dmp.filename)
    dmp.ref.moveTo(newFile, true)
    (newFile, dmp.filename, relFilePath)
  }

  private def fetchGroupedBuckets = dumpDb.forBucketsNoContent(bucketDb.bucketsSortedByDate2())

  private def handleUpload(request: MultiPartRequest) = {
    val futureResults = Future.sequence(request.body.files.map { dmp =>
      val (newFile, filename, relFilePath) = moveFile(dmp)

      Logger.info(s"parsing DMP $filename")
      implicit val analyzingTimeout = Timeout(configuration.getInt("dmpster.analyzer.timeout.minutes").getOrElse(60) minutes)
      val futureResult = ask(analyzeMaster, Work(newFile)).mapTo[utils.Result]

      for {
        utils.Result(file, bucketName, content) <- futureResult
        bucket = bucketDb.findOrCreate(bucketName)
        dump = dumpDb.create(bucket, relFilePath, content)

      } yield {
        extractTagsFrom(request).map { tags =>
          tags.foreach(tagName => dumpDb.addTag(dump, tagName))
        }.getOrElse(Logger.info("no tags provided"))
        
        val tagsForDump = Map((dump.id, tagDb.forDump(dump)))
        websocketMaster ! UpdateDump(dump, DumpJsonWriterNoDb(tagsForDump).writeForIndex)
        
        val tagsForBucket = Map((bucket.id, tagDb.forBucket(bucket)))
        val allDumps = dumpDb.forBucketsNoContentAsList(List(bucket))
        val bucketHits = Map((bucket.id, bucketHitDb.byBucket(bucket.id)))
        websocketMaster ! UpdateBucket(bucket, allDumps, BucketDumpsJsonWriterNoDb(tagsForBucket, bucketHits).jsonWriter)

        toJson(Map {
          "name" -> toJson(filename)
          "url" -> toJson(s"/dmpster/dmp/${dump.id}/details")
        })
      }

    })
    futureResults
  }
}