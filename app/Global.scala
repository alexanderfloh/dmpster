import play.api._
import play.api.mvc._
import play.api.mvc.Results._
import play.api.libs.concurrent.Akka
import play.api.Play.current
import akka.actor.Props
import utils.CleanUpActor
import concurrent.duration._
import utils.CleanUp
import play.api.libs.concurrent.Execution.Implicits._
import utils.AnalyzeMaster
import play.filters.gzip.GzipFilter
import scala.concurrent.Future

object Global extends WithFilters(new GzipFilter()) with GlobalSettings {
  override def onStart(app: Application) {
    val actor = Akka.system.actorOf(Props[CleanUpActor], name = "cleanUpActor")
    def interval = Play.mode match {
      case Mode.Dev  => 1.minutes
      case Mode.Prod => 3.hours
      case _ => 3.hours
    }
    Akka.system.scheduler.schedule(5.seconds, interval, actor, CleanUp)

    val analyzeMaster = Akka.system.actorOf(Props[AnalyzeMaster], name = "analyzeMaster")
  }

  override def onStop(app: Application) {
  }

  override def onHandlerNotFound(request: RequestHeader) = {
    Future.successful(NotFound(
      views.html.pageNotFound(request.path)
    ))
  }
}