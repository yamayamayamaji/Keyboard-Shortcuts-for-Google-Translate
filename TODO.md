* versionはconfigモジュール側で管理？
  * config.getRuntimeConfig() とか
  * configモジュールに新しいバージョンのコンフィグを足して、runtimeVersionの判定部分を変えれば他触らないで済むようにしたい
* JSONのminify,コピーなどはやるとしたらNPM Scriptで(webpackでやる必要はない)
* SASSも同上

