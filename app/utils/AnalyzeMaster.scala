package utils

import akka.actor._
import akka.routing.RoundRobinPool
import java.io.File
import akka.pattern.{ ask, pipe }
import akka.util.Timeout
import play.api.libs.concurrent.Execution.Implicits._
import scala.concurrent.duration._
import play.Logger
import play.api.Play
import scala.language.postfixOps
import javax.inject.Inject
import play.api.Configuration
import javax.inject.Named
import play.api.libs.concurrent.InjectedActorSupport
import scala.util.Try
import scala.util.Success
import scala.util.Failure

case class Work(file: File)
case class Result(file: File, bucketName: String, content: String)
case class QueryRunningJobs()
case class RunningJobs(jobs: List[File])
case class FinishedWork(file: File)
case class AnalysisFailed(file: File, ex: Throwable)

class AnalyzeMaster @Inject() (
  configuration: Configuration,
  workerFactory: AnalyzeWorker.Factory
) extends Actor with InjectedActorSupport {

  val analyzingTimeout = Timeout(configuration.getInt("dmpster.analyzer.timeout.minutes").getOrElse(60) minutes)

  val activeWork = collection.mutable.ListBuffer[File]()

  val analyzerWorkers = configuration.getInt("dmpster.analyzer.workers").getOrElse(2)
  val router = injectedChild(workerFactory(), "worker", _.withRouter(RoundRobinPool(analyzerWorkers)))

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
//      websocket
    }
    
    case AnalysisFailed(file, ex) => {
      Logger.warn(s"analysis failed for file $file", ex)
      activeWork -= file
    }
  }
}

object AnalyzeWorker {
  trait Factory {
    def apply(): Actor
  }
}

class AnalyzeWorker @Inject() (
    parser: DmpParser,
    @Named("analyze-master") analyzeMaster: ActorRef) extends Actor {

  import AnalyzeWorker._

  def receive = {
    case Work(file) => {
      Try(parser.parse(file)) match {
        case Success(result) => {
          val ParseResult(bucketName, content) = result
          Logger.info(s"parsing complete for $file")
          sender ! Result(file, bucketName, content)
          analyzeMaster ! FinishedWork(file)
        }
        case Failure(ex) => analyzeMaster ! AnalysisFailed(file, ex)
      }
    }
  }
}

