### リリース時手順
* ver2.8.2.0時点ではChrome用とFirefox用の差異はmanifest.jsonのみ
  * forFirefoxAddOns/ 内にあるminifest.json がFirefox用なので、これのバージョンを変更して提出すれば良い
* Chrome用はdistディレクトリをzipしたものを提出しているが、Firefox用はディレクトリの中身だけをzipしたものを提出する必要がある


#### リリース時メモ
リリース時に、minifyや難読化をしている場合はもとのソースコードとビルド手順を書いたものを提出せよ、と注記が出る。
gruntで使用しているjsonのminify、sassはこれにあたらないようで、「難読化を使用していない」として申請して問題なかった。


### 一時的な拡張機能を再読み込みする
- https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/Temporary_Installation_in_Firefox
- 拡張機能の一時的なインストール方法:
  - Firefox を開く
  - アドレスバーに "about:debugging" と打ち込む
  - "一時的なアドオンを読み込む" をクリックする
  - 拡張機能のディレクトリを開き、拡張機能のmanifest.jsonファイルを選択します。

