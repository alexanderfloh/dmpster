name := "dmpster"

version := "1.0-SNAPSHOT"

scalaVersion := "2.11.7"

resolvers += "scalaz-bintray" at "https://dl.bintray.com/scalaz/releases"

libraryDependencies ++= Seq(
  jdbc,
  cache,
  filters,
  evolutions,
  specs2 % Test,
  "com.typesafe.play" %% "anorm" % "2.4.0",
  "org.webjars" % "requirejs" % "2.1.14-1",
  "org.webjars" % "jquery" % "2.1.1",
  "org.webjars" % "jquery-ui" % "1.11.0",
  "org.webjars" % "jquery-file-upload" % "9.5.7",
  "org.webjars.npm" % "react" % "15.5.4",
  "org.webjars.bower" % "d3" % "3.5.5",
  "org.webjars" % "marked" % "0.3.2-1",
  "org.webjars.bower" % "highlightjs" % "8.5.0"
)

lazy val root = (project in file(".")).enablePlugins(PlayScala).enablePlugins(SbtWeb)

includeFilter in (Assets, LessKeys.less) := "*.less"

excludeFilter in (Assets, JshintKeys.jshint) := GlobFilter("cal-heatmap.js") || GlobFilter("common.js") || GlobFilter("jquery.balloon.js")

pipelineStages := Seq(rjs, digest, gzip)

RjsKeys.modules := Seq(
    WebJs.JS.Object("name" -> "mainIndex"),
    WebJs.JS.Object("name" -> "mainDetails"),
    WebJs.JS.Object("name" -> "mainBucket")
)

ReactJsKeys.harmony := true


//fork in run := true
