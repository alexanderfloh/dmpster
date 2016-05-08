package utils

import scala.io.Source
import scala.collection.JavaConversions._
import play.api.Play
import scala.sys.process.ProcessBuilder
import play.api.Logger
import scala.util.Random
import javax.inject.Inject
import bitness._

trait DumpBitness

package object bitness {
  case object X86Dump extends DumpBitness
  case object X64Dump extends DumpBitness
  case object UnknownDump extends DumpBitness
}

trait IDmpParserImpl {

  def parse: ParseResult = {
    val lines = readFile
    val bucketName = lines.find(_.startsWith("FAILURE_BUCKET_ID:"))
      .map(_.split(" ").last)
      .getOrElse("unknown bucket")
    ParseResult(bucketName, lines.mkString("\n"))
  }

  protected def readFile: List[String]
}

case class DmpParserImpl(file: java.io.File, config: ParseConfig) extends IDmpParserImpl {
  protected def readFile = {
    val bitness = detectBitness
    Logger.info(s"detected Bitness for $file: $bitness")
    val commands = List(config.cdbForBitness(bitness),
      "-y",
      config.symbolPath,
      "-srcpath",
      config.sourcePath,
      "-i",
      config.imagePath,
      "-c",
      "$$<" + config.scriptForBitness(bitness),
      "-z",
      file.getAbsolutePath())

    executeCommand(commands)
  }

  protected def detectBitness = {
    val commands = List(config.cdbPathX86,
      "-c",
      ".detach",
      "-z",
      file.getAbsolutePath())

    val output = executeCommand(commands)
    val x86Marker = "Free x86".toLowerCase
    val x64Marker = "Free x64".toLowerCase
    if (output.exists(_.toLowerCase.contains(x86Marker))) X86Dump
    else if (output.exists(_.toLowerCase.contains(x64Marker))) X64Dump
    else UnknownDump
  }

  protected def executeCommand(commandWithArgs: List[String]) = {
    import scala.sys.process._
    val forwardErrorsToApplicationLog = ProcessLogger(line => Logger.warn(line))
    val outStream = commandWithArgs.lineStream_!(forwardErrorsToApplicationLog)
    outStream.toList
  }
}

case class DummyParser() extends IDmpParserImpl {
  val rand = new Random
  protected def readFile = {
    //Thread.sleep(5 * 1000)
    Source.fromFile("dummy.txt").getLines.toList
  }

  override def parse: ParseResult = {
    val lines = readFile
    val bucketName = lines.find(_.startsWith("FAILURE_BUCKET_ID:"))
      .map(_.split(" ").last)
      .getOrElse("unknown bucket")
    ParseResult(s"$bucketName ${rand.nextInt(5).toString}", lines.mkString("\n"))
  }
}

case class ParseConfig(
  cdbPathX86: String,
  cdbPathX64: String,
  scriptPathX86: String,
  scriptPathX64: String,
  symbolPath: String,
  sourcePath: String,
  imagePath: String) {
  def cdbForBitness(bitness: DumpBitness) = bitness match {
    case X64Dump => cdbPathX64
    case X86Dump => cdbPathX86
  }

  def scriptForBitness(bitness: DumpBitness) = bitness match {
    case X64Dump => scriptPathX64
    case X86Dump => scriptPathX86
  }
}

case class ParseResult(bucketName: String, content: String)

class DmpParser @Inject() (application: play.api.Application) {
  val config = application.configuration
  lazy val cdbPath = config.getString("dmpster.cdb.path.x86").getOrElse("cdb")
  lazy val cdbPathX64 = config.getString("dmpster.cdb.path.x64").getOrElse(cdbPath)

  lazy val symbolPath = config.getString("dmpster.symbol.path").getOrElse("")
  lazy val sourcePath = config.getString("dmpster.source.path").getOrElse("")
  lazy val imagePath = config.getString("dmpster.image.path").getOrElse("")

  lazy val scriptPath = config.getString("dmpster.script.path.default").getOrElse("conf\\commands.txt")
  lazy val scriptPathX86 = config.getString("dmpster.script.path.x86").getOrElse(scriptPath)
  lazy val scriptPathX64 = config.getString("dmpster.script.path.x64").getOrElse(scriptPath)

  def parse(file: java.io.File): ParseResult = {
    if (application.configuration.getBoolean("dmpster.fake.analyzing").getOrElse(false))
      DummyParser().parse
    else
      DmpParserImpl(file, ParseConfig(cdbPath, cdbPathX64, scriptPathX86, scriptPathX64, symbolPath, sourcePath, imagePath)).parse
  }

  def cdbForBitness(bitness: DumpBitness) = bitness match {
    case X64Dump => cdbPathX64
    case _       => cdbPath
  }

  def scriptForBitness(bitness: DumpBitness) = bitness match {
    case X64Dump => scriptPathX64
    case X86Dump => scriptPathX86
    case _       => scriptPath
  }

}