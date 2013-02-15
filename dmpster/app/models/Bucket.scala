package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current

case class Bucket(id: Long, name: String, filename: String, content: String)

object Bucket {
  def all(): List[Bucket] = DB.withConnection { implicit c =>
    SQL("select * from bucket").as(bucket *)
  }
  
  def create(name: String, filename: String, content: String) = {
    DB.withConnection { implicit c =>
      SQL("insert into bucket (name, filename, content) values ({name}, {filename}, {content})").on(
        'name -> name, 'filename -> filename, 'content -> content).executeUpdate
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
      get[String]("filename") ~
      get[String]("content") map {
        case id ~ name ~ filename ~ content => Bucket(id, name, filename, content)
      }
  }
}