package utils

import scala.io.Source
import scala.collection.JavaConversions._

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
    val commands = List("C:\\Program Files (x86)\\Windows Kits\\8.0\\Debuggers\\x86\\cdb.exe",
	      "-logo",
	      "out.log",
	      "-y",
	      "cache*s:\\temp\\symbolcache;srv*http://lnz-jenny/symbolstore;srv*http://lnz-jenny/symbolstore-release;srv*http://msdl.microsoft.com/download/symbols;srv*http://chromium-browser-symsrv.commondatastorage.googleapis.com;srv*http://symbols.mozilla.org/firefox;srv*http://symbols.mozilla.org/xulrunner",
	      "-srcpath",
	      "srv*",
	      "-i",
	      "srv*http://msdl.microsoft.com/download/symbols",
	      "-c",
	      "!analyze -v;~*kb;.detach",
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
  protected def readFile = Source.fromFile("dummy.txt").getLines.toList 
}

object DmpParser {
  def apply(file: java.io.File) = {
    if (System.getProperty("os.name").toLowerCase.contains("win"))
      new DmpParserImpl(file)
    else
      new DummyParser
  }

}