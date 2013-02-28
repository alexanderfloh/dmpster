package models

import play.api.db._
import play.api.Play.current
import anorm._
import anorm.SqlParser._

case class Bucket(id: Long, name: String)

object Bucket {
  def all: List[Bucket] = DB.withConnection { implicit c =>
    SQL("select * from bucket").as(bucket *)
  }

  def create(name: String) : Option[Long] = DB.withConnection { implicit c =>
    SQL("insert into bucket (name) values ({name})")
    .on('name -> name)
    .executeInsert()
  }

  def byId(id: Long) = DB.withConnection { implicit c =>
    SQL("select * from bucket where id = {id}").on('id -> id).as(bucket single)
  }

  def bucket = {
    get[Long]("id") ~
      get[String]("name") map {
        case id ~ name => Bucket(id, name)
      }
  }
}