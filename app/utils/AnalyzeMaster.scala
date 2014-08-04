package utils

import akka.actor._
import akka.routing.RoundRobinRouter
import java.io.File
import akka.pattern.{ ask, pipe }
import akka.util.Timeout
import play.api.libs.concurrent.Execution.Implicits._
import scala.concurrent.duration._
import play.Logger
import play.api.Play
import scala.language.postfixOps

case class Work(file: File)
case class Result(file: File, bucketName: String, content: String)
case class QueryRunningJobs()
case class RunningJobs(jobs: List[File])
case class FinishedWork(file: File)

class AnalyzeMaster extends Actor {
  val analyzingTimeout = Timeout(Play.current.configuration.getInt("dmpster.analyzer.timeout.minutes").getOrElse(60) minutes)
  
  val activeWork = collection.mutable.ListBuffer[File]()
  
  val analyzerWorkers = Play.current.configuration.getInt("dmpster.analyzer.workers").getOrElse(2)
  val router = context.actorOf(Props[AnalyzeWorker].withRouter(RoundRobinRouter(analyzerWorkers)), "router")

  def receive = {
    case work @ Work(file) => {
      Logger.info(s"adding $file to active work")
      activeWork.append(file)
      implicit val t = analyzingTimeout
      val result = router ? work
      pipe(result) to sender
    }

    case QueryRunningJobs => {
      sender ! RunningJobs(activeWork.toList)
    }

    case FinishedWork(file) => {
      Logger.info(s"removing $file from active work")
      activeWork -= file
    }
  }
}

class AnalyzeWorker extends Actor {
  def receive = {
    case Work(file) => {
      val (bucketName, content) = DmpParser(file).parse
      sender ! Result(file, bucketName, content)
      context.actorSelection("../..") ! FinishedWork(file)
    }
  }
}

