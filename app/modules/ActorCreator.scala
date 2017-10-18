package modules

import play.api.Environment
import concurrent.duration._
import com.google.inject.AbstractModule
import play.api.libs.concurrent.AkkaGuiceSupport
import play.api.Configuration
import utils.AnalyzeMaster
import utils.AnalyzeWorker
import utils.CleanUpActor
import utils.CleanupActorSchedulerImpl
import utils.CleanUpActorScheduler
import controllers.WebSocketMaster
import controllers.WebSocketWorker

class ActorCreator(
  environment: Environment,
  configuration: Configuration
  ) extends AbstractModule with AkkaGuiceSupport {

  def configure = {
    bindActor[AnalyzeMaster]("analyze-master")
    bindActorFactory[AnalyzeWorker, AnalyzeWorker.Factory]
    
    bindActor[WebSocketMaster]("websocket-master")
    
    bindActor[CleanUpActor]("clean-up-actor")
    bind(classOf[CleanUpActorScheduler]).to(classOf[CleanupActorSchedulerImpl]).asEagerSingleton()
  }
}