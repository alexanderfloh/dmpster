import play.api._
import play.api.libs.concurrent.Akka
import play.api.Play.current
import akka.actor.Props
import utils.CleanUpActor
import concurrent.duration._
import utils.CleanUp
import play.api.libs.concurrent.Execution.Implicits._

object Global extends GlobalSettings {
  override def onStart(app: Application) {
    val actor = Akka.system.actorOf(Props[CleanUpActor], name = "cleanUpActor")
    def interval = Play.mode match {
      case Mode.Dev => 30.seconds
      case Mode.Prod => 24.hours
    }
    Akka.system.scheduler.schedule(5.seconds, interval, actor, CleanUp)
  }

  override def onStop(app: Application) {
  }
}