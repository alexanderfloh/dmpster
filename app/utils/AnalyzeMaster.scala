package utils

import akka.actor._
import akka.routing.RoundRobinRouter
import java.io.File
import akka.pattern.{ ask, pipe }
import akka.util.Timeout
import play.api.libs.concurrent.Execution.Implicits._
import scala.concurrent.duration._
import play.Logger

case class Work(file: File)
case class Result(file: File, bucketName: String, content: String)
case class QueryRunningJobs()
case class RunningJobs(jobs: List[File])
case class FinishedWork(file: File)

class AnalyzeMaster extends Actor {
  val activeWork = collection.mutable.ListBuffer[File]()

  def receive = {
    case work @ Work(file) => {
      val worker = context.actorOf(Props[AnalyzeWorker])

      Logger.info("adding " + file + " to active work")
      activeWork.append(file)
      implicit val timeout = Timeout(5 minutes)
      val result = worker ? work
      pipe(result) to sender
    }
    
    case QueryRunningJobs => {
      sender ! RunningJobs(activeWork.toList)
    }

    case FinishedWork(file) => {
      Logger.info("removing " + file + " from active work")
      activeWork -= file
    }
  }
}

class AnalyzeWorker extends Actor {
  def receive = {
    case Work(file) => {
      val result = DmpParser(file).parse
      sender ! Result(file, result._1, result._2)
      this.context.parent ! FinishedWork(file)
    }
  }
}

