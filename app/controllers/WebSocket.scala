package controllers

import play.api.mvc._
import play.api.libs.streams._
import javax.inject.Inject
import akka.actor._
import akka.stream.Materializer
import play.api.libs.json.JsValue
import models._
import models.BucketJsonWriterNoDb
import play.api.libs.json.Json
import play.api.libs.json.Writes
import play.api.Configuration
import akka.util.Timeout
import javax.inject.Named
import play.api.libs.concurrent.InjectedActorSupport
import akka.routing.BroadcastRoutingLogic
import akka.routing.BroadcastGroup
import play.api.libs.iteratee.Concurrent
import play.api.libs.iteratee.Enumerator
import play.api.libs.iteratee.Concurrent.Channel
import akka.cluster.pubsub.DistributedPubSub
import akka.cluster.pubsub.DistributedPubSubMediator

case class UpdateBucket(bucket: Bucket, dumps: Seq[Dump], jsonWriter: Writes[(Bucket, Seq[Dump])])
case class UpdateDump(dump: Dump, jsonWriter: Writes[Dump])

class WebSocket @Inject() (
    implicit system: ActorSystem,
    materializer: Materializer) {
  
  def socket = WebSocket.accept[JsValue, JsValue] { request =>
    ActorFlow.actorRef(out => WebSocketWorker.props(out))
  }

}

object WebSocketWorker {
  def props(out: ActorRef) = Props(new WebSocketWorker(out))
}

class WebSocketWorker(out: ActorRef) extends Actor {
  import DistributedPubSubMediator. { Subscribe, SubscribeAck }
  val mediator = DistributedPubSub(context.system).mediator
  
  mediator ! Subscribe("updateBucket", self)
  mediator ! Subscribe("updateDump", self)
  
  def receive = {
    case UpdateBucket(bucket, dumps, jsonWriter) => {
      implicit val bucketWriter = jsonWriter
      out ! Json.obj(
        "type" -> "updateBucket",
        "bucket" -> Json.toJson((bucket, dumps))
      )
    }
    
    case UpdateDump(dump, jsonWriter) => {
      implicit val dumpWriter = jsonWriter
      out ! Json.obj(
        "type" -> "updateDump",
        "dump" -> Json.toJson(dump)
      )
    }
  }
}

class WebSocketMaster() extends Actor {
  import akka.cluster.pubsub.DistributedPubSubMediator.Publish  
  val mediator = DistributedPubSub(context.system).mediator
  
  def receive = {
    case updateBucket: UpdateBucket => mediator ! Publish("updateBucket", updateBucket)
    case updateDump: UpdateDump => mediator ! Publish("updateDump", updateDump) 
    
  }
}

