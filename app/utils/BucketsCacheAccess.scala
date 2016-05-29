package utils

import play.api.cache.Cache
import play.api.libs.json.JsObject
import javax.inject.Inject
import play.api.cache.CacheApi
import scala.concurrent.duration.Duration
import scala.concurrent.duration.MINUTES
import play.cache.NamedCache
import javax.inject.Singleton
import models.Bucket
import models.Bucket._
import models.Dump

class BucketsCacheAccess @Inject() @Singleton() (@NamedCache("buckets") cache: CacheApi) {
  val bucketsKey = "buckets"
  val bucketsAsJsonKey = "bucketsAsJson"
  val defaultCacheDuration = Duration(10, MINUTES) //TODO: read from config

  def setBuckets(buckets: GroupedBuckets) = {
    cache.set(bucketsKey, buckets, defaultCacheDuration)
    invalidateJsonCache()
  }

  def invalidate() = {
    cache.remove(bucketsKey)
    invalidateJsonCache()
  }
  
  def invalidateJsonCache() = cache.remove(bucketsAsJsonKey)
  
  def getOrElse(orElse: =>JsObject) = 
    cache.getOrElse[JsObject](bucketsAsJsonKey, defaultCacheDuration)(orElse)

  def getBucketsOrElse(orElse: => GroupedBuckets): GroupedBuckets = {
    cache.getOrElse[GroupedBuckets](bucketsKey, defaultCacheDuration)(orElse)
  }

  def updateBucketOrElse(bucket: Bucket)(orElse: => GroupedBuckets) {
    val buckets = getBucketsOrElse(orElse)

    val bucketIndex = buckets.indexWhere(findBucket(bucket, _))

    val (oldBucket, dumps) = buckets(bucketIndex)
    val newBuckets = buckets.updated(bucketIndex, (bucket, dumps))

    setBuckets(newBuckets)
  }
  
  def addDumpOrElse(bucket: Bucket, newDump: Dump)(orElse: => GroupedBuckets) {
    val buckets = getBucketsOrElse(orElse)
       
    if(buckets.exists(findBucket(bucket, _))) {
      val bucketIndex = buckets.indexWhere(findBucket(bucket, _))
      val (oldBucket, dumps) = buckets(bucketIndex)
      setBuckets((bucket, newDump :: dumps) :: buckets.filterNot(findBucket(bucket, _)))
    }
    else {
      setBuckets((bucket, List(newDump)) :: buckets)
    }
      
  }
  
  
  private def findBucket(bucketToFind: Bucket, other: (Bucket, List[Dump])) = {
    val (b, dumps) = other
    bucketToFind.id == b.id
  }
}