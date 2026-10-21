---
layout: post
title: "JSPatch learning notes"
description: "Tutorial"
comments: true
category: "iOS"
tags: [JSPatch, iOS, 开发]
machineTranslated: true
---

## Dependencies

* `JavascriptCore.framework`

* `<objc/runtime.h>`

## How it works

It exploits the Objective-C runtime to add or replace methods of a given class dynamically, as well as to register new classes.

* Message passing

Methods are defined in JS in the form of Blocks via JSContext, then executed on the Objective-C side, with return values passed back to JS. All parameter types are converted automatically by JavascriptCore.

## Key points

* **require**

Creates a variable of the same name in the JS global scope. The variable points to an object whose __clsName property stores the class name, and which indicates that the object is an OC class.

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

By injecting the `_OC_defineClass` method into the script global from `JPEngine`, then calling `defineClass` in JSPatch.js, which in essence calls the Objective-C `_OC_defineClass`.

```objc
context[@"_OC_defineClass"] = ^(NSString *classDeclaration, JSValue *instanceMethods, JSValue *classMethods) {
        return defineClass(classDeclaration, instanceMethods, classMethods);
    };
```

The implementation of defineClass in JS is then as follows. The parameter list:
1. the class name string
2. the property list, already converted to JS data types
3. the list of the class's instance methods and class methods

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

Normalises JS methods.

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

Modifies the JS object passed in.

The original form is:

```
    {
        handleBtn：function（）｛...｝
    ｝
```

After the change:

```
    {
        handleBtn: [argCount,function (){...新的实现}]
    }
```

Because the original JS implementation function cannot be parsed directly, the number of parameters is unknown. Particularly when creating a new method, the method signature must be generated from the number of parameters, so all we can do is take the JS function's argument count on the JS side and pass it to the Objective-C side.

* **the _c() function**

It does not actually exist; it is custom, used to forward non-existent methods to a specific function.

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

## Usage

```objc
[JPEngine startEngine];
NSString *sourcePath = [[NSBundle mainBundle] pathForResource:@"demo" ofType:@"js"];
NSString *script = [NSString stringWithContentsOfFile:sourcePath encoding:NSUTF8StringEncoding error:nil];
[JPEngine evaluateScript:script];
```

## Pitfalls

* All primitive data types need no conversion to NSNumber/NSValue; they are converted automatically

* CGRect must be written in the prescribed format, for example `CGRectMake(1, 2, 4.2, 1)` or `CGRectMake(x, y, width, height)`

* Category methods cannot be called

* weakSelf cannot use typedef; just define a new variable

* Do not use GCD

* Enums are not supported; use Int

* Do not use underscores inside method names, because methods are converted into xxx_xxx_xxx

* NSLog is ineffective; use MBProgressHUD pop-ups for debugging

```js
var weakSelf = self;
```

## Extensions

* Struct

* Extension

## Security

* Full-file checksum, compared with the encrypted result on the server

* Use URLs rather than plain JS for delivery, and use https to avoid man-in-the-middle attacks

* Prevent tampering with local sandbox files

* JSLoader

  The delivery class provided officially

## Convertor

* [project home](https://github.com/bang590/JSPatchConvertor)

* [demo page](http://bang590.github.io/JSPatchConvertor/)

  * Not supported:
    1. Macro / constant variable / Enum
    2. C function calling
    3. GCD functions
    4. Pointer / Struct
    5. Getting / Setting private variable

## Plugin

[JSPatchX](https://github.com/bang590/JSPatchX)
