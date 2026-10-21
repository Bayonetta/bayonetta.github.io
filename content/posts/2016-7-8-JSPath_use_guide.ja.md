---
layout: post
title: "JSPatch学習ノート"
description: "チュートリアル"
comments: true
category: "iOS"
tags: [JSPatch, iOS, 开发]
machineTranslated: true
---

## 依存

* `JavascriptCore.framework`

* `<objc/runtime.h>`

## 原理

OCのランタイム特性を利用して、指定したクラスのメソッドを動的に追加または置換したり、新しいクラスを登録したりします。

* メッセージパッシング

JSContextを通じてBlockの形式でメソッドを定義し、OC側で実行して、戻り値をJSに渡します。引数の型はすべてJavascriptCoreによって自動変換されます。

## キーワード

* **require**

JSのグローバルスコープ上に同名の変数を作成します。変数はあるオブジェクトを指し、オブジェクトのプロパティ __clsName がクラス名を保持し、同時にこのオブジェクトが OC Class であることを示します。

```js
var _require = function(clsName) {
  if (!global[clsName]) {
    global[clsName] = {
      __clsName: clsName
    }
  }
  return global[clsName]
}
```

* **defineClass**

`JPEngine`でスクリプトのグローバルに`_OC_defineClass`メソッドを注入し、JSPatch.js内で`defineClass`メソッドを呼び出します。実質的にはOCの`_OC_defineClass`メソッドを呼び出すことになります。

```objc
context[@"_OC_defineClass"] = ^(NSString *classDeclaration, JSValue *instanceMethods, JSValue *classMethods) {
        return defineClass(classDeclaration, instanceMethods, classMethods);
    };
```

js側でのdefineClassの実装は以下の通りです。パラメータリスト：
1. クラス名の文字列
2. プロパティリスト。既にJSのデータ型に変換済み
3. クラスのインスタンスメソッドとクラスメソッドのリスト

```js
global.defineClass = function(declaration, properties, instMethods, clsMethods) {
    var newInstMethods = {}, newClsMethods = {}
    if (!(properties instanceof Array)) {
      clsMethods = instMethods
      instMethods = properties
      properties = null
    }

    var realClsName = declaration.split(':')[0].trim()

    _formatDefineMethods(instMethods, newInstMethods, realClsName)
    _formatDefineMethods(clsMethods, newClsMethods, realClsName)

    var ret = _OC_defineClass(declaration, newInstMethods, newClsMethods)
    var className = ret['cls']
    var superCls = ret['superCls']

    _ocCls[className] = {
      instMethods: {},
      clsMethods: {},
      props: {}
    }

    if (superCls.length && _ocCls[superCls]) {
      for (var funcName in _ocCls[superCls]['instMethods']) {
        _ocCls[className]['instMethods'][funcName] = _ocCls[superCls]['instMethods'][funcName]
      }
      for (var funcName in _ocCls[superCls]['clsMethods']) {
        _ocCls[className]['clsMethods'][funcName] = _ocCls[superCls]['clsMethods'][funcName]
      }
      if (_ocCls[superCls]['props']) {
        _ocCls[className]['props'] = JSON.parse(JSON.stringify(_ocCls[superCls]['props']));
      }
    }

    _setupJSMethod(className, instMethods, 1, realClsName)
    _setupJSMethod(className, clsMethods, 0, realClsName)

    if (properties) {
      properties.forEach(function(o){
        _ocCls[className]['props'][o] = 1
        _ocCls[className]['props']['set' + o.substr(0,1).toUpperCase() + o.substr(1)] = 1
      })
    }
    return require(className)
  }
```

* **_formatDefineMethods**

JSメソッドを正規化します。

```js
 var _formatDefineMethods = function(methods, newMethods, realClsName) {
    for (var methodName in methods) {
      if (!(methods[methodName] instanceof Function)) return;
      (function(){
        var originMethod = methods[methodName]
        newMethods[methodName] = [originMethod.length, function() {
          try {
            var args = _formatOCToJS(Array.prototype.slice.call(arguments))
            var lastSelf = global.self
            global.self = args[0]
            if (global.self) global.self.__realClsName = realClsName
            args.splice(0,1)
            var ret = originMethod.apply(originMethod, args)
            global.self = lastSelf
            return ret
          } catch(e) {
            _OC_catch(e.message, e.stack)
          }
        }]
      })()
    }
  }
```

渡されてきたJSオブジェクトを修正します。

元の形式は：

```
    {
        handleBtn：function（）｛...｝
    ｝
```

修正後は：

```
    {
        handleBtn: [argCount,function (){...新しい実装}]
    }
```

元のjsの実装関数を直接パースすることはできないため、引数の個数が分かりません。特に新しいメソッドを作成する際は、引数の個数に基づいてメソッドシグネチャを生成する必要があるため、js側でjs関数の引数の個数を取得してOC側に渡すことしかできません。

* **_c()関数**

実際には存在せず、独自のものです。存在しないメソッドを特定の関数に転送するために使います。

```js
UIView.__c('alloc')().__c('init')()
UIView.alloc().init()


Object.defineProperty(Object.prototype, '__c', {value: function(methodName) {
  if (!this.__obj && !this.__clsName) return this[methodName].bind(this);
  var self = this
  return function(){
    var args = Array.prototype.slice.call(arguments)
    return _methodFunc(self.__obj, self.__clsName, methodName, args, self.__isSuper)
  }
}})
```

## 使い方

```objc
[JPEngine startEngine];
NSString *sourcePath = [[NSBundle mainBundle] pathForResource:@"demo" ofType:@"js"];
NSString *script = [NSString stringWithContentsOfFile:sourcePath encoding:NSUTF8StringEncoding error:nil];
[JPEngine evaluateScript:script];
```

## 落とし穴

* すべての基本データ型はNSNumber/NSValueに変換する必要はなく、自動変換されます

* CGRectは規定の書式で書く必要があります。例：`CGRectMake(1, 2, 4.2, 1)` または `CGRectMake(x, y, width, height)`

* カテゴリメソッドは呼び出せません

* weakSelfはtypedefを使えません。新しい変数を直接定義してください

* GCDは使わないでください

* 列挙型変数は非対応です。Intを使ってください

* メソッド内に_を入れないでください。メソッドはxxx_xxx_xxxに変換されるためです

* NSLogは無効です。MBProgressHUDでポップアップを出してデバッグしてください

```js
var weakSelf = self;
```

## 拡張

* Struct

* Extension

## セキュリティ

* 完全なファイルの検証値。サーバーとローカルの暗号化結果を比較します

* URLを使い、JSの平文では渡さず、httpsを使って中間者攻撃を避けます

* ローカルサンドボックスのファイル改ざんを防ぎます

* JSLoader

  公式が提供する配信用のClass

## Convertor

* [プロジェクトページ](https://github.com/bang590/JSPatchConvertor)

* [試用ページ](http://bang590.github.io/JSPatchConvertor/)

  * 非対応の内容：
    1. Macro / constant variable / Enum
    2. C function calling
    3. GCD functions
    4. Pointer / Struct
    5. Getting / Setting private variable

## Plugin

[JSPatchX](https://github.com/bang590/JSPatchX)
