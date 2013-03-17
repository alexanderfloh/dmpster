package utils

import org.joda.time.DateTime

object Joda {
  implicit def dateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isAfter _)
}