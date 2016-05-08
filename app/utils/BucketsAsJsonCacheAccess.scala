package utils

import play.api.Play.current
import play.api.cache.Cache
import play.api.libs.json.JsObject
import javax.inject.Inject
import play.api.cache.CacheApi
import scala.concurrent.duration.Duration
import scala.concurrent.duration.MINUTES
import play.cache.NamedCache
import javax.inject.Singleton

class BucketsAsJsonCacheAccess @Inject() @Singleton() (@NamedCache("buckets-as-json") cache: CacheApi) {
  val bucketsAsJsonKey = "bucketsAsJson"

  def invalidate() = {
    cache.remove(bucketsAsJsonKey)
  }

  def getOrElse()(orElse: => JsObject): JsObject = {
    cache.getOrElse[JsObject](bucketsAsJsonKey, Duration(2, MINUTES))(orElse)
  }
}