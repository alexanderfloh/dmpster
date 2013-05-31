package utils

import scala.io.Source
import scala.collection.JavaConversions._
import play.api.Play

trait DmpParser {
  def parse: (String, String) = {
    val lines = readFile
    val bucketName = lines.find(_.startsWith("FAILURE_BUCKET_ID:")).map(_.split(" ").last).getOrElse("unknown bucket")
    (bucketName, lines.mkString("\n"))
  }
  
  protected def readFile : List[String]
}

class DmpParserImpl(file: java.io.File) extends DmpParser {
  protected def readFile = {
    import DmpParser._
    val commands = List(cdbPath,
	      "-y",
	      symbolPath,
	      "-srcpath",
	      sourcePath,
	      "-i",
	      imagePath,
	      "-c",
	      //"!analyze -v;~*kb;.detach",
	      "!analyze -v;.detach",
	      "-z",
	      file.getAbsolutePath())
	      
    val pb = new ProcessBuilder(commands)
    pb.redirectErrorStream(true)
    
    val process = pb.start()
    process.getOutputStream().close
    
    val is = process.getInputStream()
    val lines = Source.fromInputStream(is).getLines.toList
    process.waitFor()
    lines
  }
}

class DummyParser extends DmpParser {
  protected def readFile = {
    Thread.sleep(30 * 1000)
    Source.fromFile("dummy.txt").getLines.toList 
  }
}

object DmpParser {
  lazy val cdbPath = Play.current.configuration.getString("dmpster.cdb.path").getOrElse("cdb")
  lazy val symbolPath = Play.current.configuration.getString("dmpster.symbol.path").getOrElse("")
  lazy val sourcePath = Play.current.configuration.getString("dmpster.source.path").getOrElse("")
  lazy val imagePath = Play.current.configuration.getString("dmpster.image.path").getOrElse("")
  
  def apply(file: java.io.File) = {
    if (System.getProperty("os.name").toLowerCase.contains("win"))
      new DmpParserImpl(file)
    else
      new DummyParser
  }

}