package filters

import play.filters.gzip.GzipFilter
import javax.inject.Inject
import play.api.http.HttpFilters

class Filters @Inject() (gzip: GzipFilter) extends HttpFilters {
  val filters = Seq(gzip)
}