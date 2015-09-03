package utils

import org.specs2.mutable._
import play.api.test._
import play.api.test.Helpers._
import models.Bucket
import org.joda.time.DateTime
import controllers.Application
import models.Dump
import scala.collection.immutable.ListMap

class TestBucketGrouping extends Specification {
  "Buckets" should {
    "be grouped and sorted by date" in {
      val bucket = Bucket(1, "asdf", "some notes")
      val dump1 = Dump(1, bucket, "dump1.dmp", "a crash!", new DateTime().minusDays(5))
      val dump2 = Dump(2, bucket, "dump2.dmp", "another crash!", new DateTime())
      val dump3 = Dump(3, bucket, "dump3.dmp", "3rd crash!", new DateTime().minusDays(7))
      Dump.groupDumpsByBucket(List(dump1, dump2, dump3)) must equalTo(List((bucket) -> List(dump2, dump1, dump3)))
    }
  }
  
  def time[R](block: => R) = {
    val t0 = System.nanoTime()
    val result = block    // call-by-name
    val t1 = System.nanoTime()
    val diff = (t1 - t0) / 1000000
    diff
  }
  
  "Buckets" should {
    "be grouped" in new WithApplication {
      
      time { Dump.forBucketsNoContent(Bucket.bucketsSortedByDate2()) } must be lessThan( 
      time { Dump.groupDumpsByBucket(Dump.all) })
      
      time { Dump.forBucketsNoContent(Bucket.bucketsSortedByDate2()) } must be lessThan( 
      time { Dump.groupDumpsByBucket(Dump.all) })
      
      val times = (1 to 100).map { i =>
        (time { Dump.forBucketsNoContent(Bucket.bucketsSortedByDate2()) }, 
        time { Dump.groupDumpsByBucket(Dump.all) })  
      }
      
      val (newQuery, oldQuery) = times.unzip
      println(s"oldQuery: ${oldQuery.sum} $oldQuery, newQuery: ${newQuery.sum} $newQuery")
      
      newQuery.sum must be lessThan oldQuery.sum
      
      times.foreach { case (newTime, oldTime) =>
        newTime must be lessThan oldTime
      }
      
    }
  }

}