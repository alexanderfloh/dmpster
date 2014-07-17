

//import PlayKeys._

name := "dmpster"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache
)

lazy val root = (project in file(".")).enablePlugins(PlayScala).enablePlugins(SbtWeb)

includeFilter in (Assets, LessKeys.less) := "styles.less"

