package utils

import play.api.Play.current
import play.api.cache.Cache
import play.api.libs.json.JsObject

object BucketsAsJsonCacheAccess {
  val bucketsAsJsonKey = "bucketsAsJson"

  def invalidateCache() = {
    Cache.remove(bucketsAsJsonKey)
  }

  def getOrElse(expiration: Int)(orElse: => JsObject): JsObject = {
    Cache.getOrElse[JsObject](bucketsAsJsonKey, 120)(orElse)
  }
}