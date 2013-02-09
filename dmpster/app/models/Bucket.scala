package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current

case class Bucket(id: Long, name: String, content: String)

object Bucket {
  def all(): List[Bucket] = DB.withConnection { implicit c =>
    SQL("select * from bucket").as(bucket *)
  }
  
  def create(name: String, content: String) = {
    DB.withConnection { implicit c =>
      SQL("insert into bucket (name, content) values ({name}, {content})").on(
        'name -> name, 'content -> content).executeUpdate
    }
  }
  
  def delete(id: Long) = {
    DB.withConnection { implicit c =>
      SQL("delete from bucket where id = {id}").on('id -> id).executeUpdate
    }
  }

  val bucket = {
    get[Long]("id") ~
      get[String]("name") ~
      get[String]("content") map {
        case id ~ name ~ content => Bucket(id, name, content)
      }
  }
}