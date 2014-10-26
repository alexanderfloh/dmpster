package utils

import scala.io.Source
import scala.collection.JavaConversions._
import play.api.Play
import scala.sys.process.ProcessBuilder
import play.api.Logger

trait DumpBitness
case object X86Dump extends DumpBitness
case object X64Dump extends DumpBitness
case object UnknownDump extends DumpBitness

trait DmpParser {

  def parse: (String, String) = {
    val lines = readFile
    val bucketName = lines.find(_.startsWith("FAILURE_BUCKET_ID:"))
      .map(_.split(" ").last)
      .getOrElse("unknown bucket")
    (bucketName, lines.mkString("\n"))
  }

  protected def readFile: List[String]
}

class DmpParserImpl(file: java.io.File) extends DmpParser {
  protected def readFile = {
    val bitness = detectBitness
    Logger.info(s"detected Bitness for $file: $bitness")
    import DmpParser._
    val commands = List(cdbForBitness(bitness),
      "-y",
      symbolPath,
      "-srcpath",
      sourcePath,
      "-i",
      imagePath,
      "-c",
      "$$<" + scriptForBitness(bitness),
      "-z",
      file.getAbsolutePath())

    executeCommand(commands)
  }

  protected def detectBitness = {
    import DmpParser._
    val commands = List(cdbPath,
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
    val outStream = commandWithArgs.lines_!(forwardErrorsToApplicationLog)
    outStream.toList
  }
}

class DummyParser extends DmpParser {
  protected def readFile = {
    //Thread.sleep(5 * 1000)
    Source.fromFile("dummy.txt").getLines.toList
  }
}

object DmpParser {
  val config = Play.current.configuration
  lazy val cdbPath = config.getString("dmpster.cdb.path.x86").getOrElse("cdb")
  lazy val cdbPathX64 = config.getString("dmpster.cdb.path.x64").getOrElse(cdbPath)

  lazy val symbolPath = config.getString("dmpster.symbol.path").getOrElse("")
  lazy val sourcePath = config.getString("dmpster.source.path").getOrElse("")
  lazy val imagePath = config.getString("dmpster.image.path").getOrElse("")

  lazy val scriptPath = config.getString("dmpster.script.path.default").getOrElse("conf\\commands.txt")
  lazy val scriptPathX86 = config.getString("dmpster.script.path.x86").getOrElse(scriptPath)
  lazy val scriptPathX64 = config.getString("dmpster.script.path.x64").getOrElse(scriptPath)

  def apply(file: java.io.File) = {
    if (Play.current.configuration.getBoolean("dmpster.fake.analyzing").getOrElse(false))
    	new DummyParser
    else
    	new DmpParserImpl(file)
  }

  def cdbForBitness(bitness: DumpBitness) = bitness match {
    case X64Dump => cdbPathX64
    case _ => cdbPath
  }

  def scriptForBitness(bitness: DumpBitness) = bitness match {
    case X64Dump => scriptPathX64
    case X86Dump => scriptPathX86
    case _ => scriptPath
  }

}