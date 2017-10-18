name := "dmpster"

version := "1.0-SNAPSHOT"

scalaVersion := "2.11.7"

resolvers += "scalaz-bintray" at "https://dl.bintray.com/scalaz/releases"

lazy val akkaVersion = "2.4.18"

libraryDependencies ++= Seq(
  jdbc,
  cache,
  filters,
  evolutions,
  specs2 % Test,
  "com.typesafe.play" %% "anorm" % "2.4.0",
  //"com.typesafe.akka" %% "akka" % akkaVersion,
  "com.typesafe.akka" %% "akka-slf4j" % akkaVersion,
  "com.typesafe.akka" %% "akka-cluster-tools" % akkaVersion,
  "org.webjars" % "requirejs" % "2.1.14-1",
  "org.webjars" % "jquery" % "2.1.1",
  "org.webjars" % "jquery-ui" % "1.11.0",
  "org.webjars" % "jquery-file-upload" % "9.5.7",
  "org.webjars.npm" % "react" % "15.5.4",
  "org.webjars.npm" % "react-dom" % "15.5.4",
  "org.webjars.bower" % "d3" % "3.5.5",
  "org.webjars" % "marked" % "0.3.2-1",
  "org.webjars.bower" % "highlightjs" % "8.5.0",
  //"org.webjars.bower" % "flux" % "3.1.2", 	
  "org.webjars.bower" % "immutable" % "3.8.1",
  "org.webjars.npm" % "react-redux" % "5.0.5",
  "org.webjars.npm" % "redux" % "3.7.0",
  "org.webjars.npm" % "classnames" % "2.2.5",
  "org.webjars.npm" % "redux-thunk" % "2.2.0",
  "org.webjars.npm" % "whatwg-fetch" % "2.0.3"
)

lazy val root = (project in file(".")).enablePlugins(PlayScala).enablePlugins(SbtWeb)

includeFilter in (Assets, LessKeys.less) := "*.less"

excludeFilter in (Assets, JshintKeys.jshint) := GlobFilter("cal-heatmap.js") || GlobFilter("common.js") || GlobFilter("jquery.balloon.js")

pipelineStages := Seq(rjs, digest, gzip)

RjsKeys.modules := Seq(
    WebJs.JS.Object("name" -> "mainIndex"),
    WebJs.JS.Object("name" -> "mainDetails"),
    WebJs.JS.Object("name" -> "mainBucket"),
    WebJs.JS.Object("name" -> "asdf")
)

ReactJsKeys.harmony := true


//fork in run := true
