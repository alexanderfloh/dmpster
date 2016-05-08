package errorhandler

import play.api.http.HttpErrorHandler
import play.api.mvc.RequestHeader
import scala.concurrent._
import play.api.mvc.Results._

class NotFoundHandler extends HttpErrorHandler {
  def onClientError(request: RequestHeader, statusCode: Int, message: String) = {
    if (statusCode == play.api.http.Status.NOT_FOUND) {
      Future.successful(NotFound(
        views.html.pageNotFound(request.path)))
    } else {
      Future.successful(
        Status(statusCode)("A client error occurred: " + message))
    }
  }
  
  def onServerError(request: RequestHeader, exception: Throwable) = {
    Future.successful(
      InternalServerError("A server error occurred: " + exception.getMessage)
    )
  }
}