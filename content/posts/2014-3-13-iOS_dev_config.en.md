---
layout: post
title: "Building an elegant iOS development environment"
description: "Tutorial"
category: "iOS"
comments: true
tags: ['iOS','Xcode','IDE']
machineTranslated: true
---

A few months ago, because of my job, my main development focus switched from Android to iOS. Having experienced how clumsy and unstable Eclipse and Android Studio of the 0.x era were, and how bloated and inconvenient they felt, opening Xcode for the first time was like a shepherd boy first encountering the metropolis; what rose up was a dense sense of happiness and novelty. A sufficiently elegant UI, gorgeous interaction, and convenient gestures deeply integrated with the trackpad — all of it brought tears to the eyes.

I have rhapsodised quite a bit, but the point is that the experience of Xcode on Mac can only be called outstanding, and being able to use it as a production platform every day is something of a privilege. Yet stock Xcode still leaves much to be desired, so making it more perfect is the first step.

## Theme

There are a great many optional themes on github, and <a href="https://github.com/tursunovic/xcode-themes">xcode-themes</a> is one of the more comprehensive collections.

I use <a href="https://github.com/brianmichel/solarized/tree/master/apple-xcode4-solarized">Solarized</a>, a general-purpose theme across platforms that provides both Dark and Light variants.

<figure class="half">
  <img src="/images/2014-3-13-1.png" alt=""/>
  <img src="/images/2014-3-13-2.png" alt=""/>
  <figcaption>Hopelessly in love from the very first sight</figcaption>
</figure>

## Font

The system font `Monaco` — my only choice. I had always used `YaHei Consolas Hybrid` under Linux/Windows; the combination of Consolas plus Microsoft YaHei once completely won me over, but the rendering under Mac is not as good as I hoped.

<figure>
  <img src="/images/2014-3-13-3.png" alt=""/>
  <figcaption>Smooth rounded corners, the heart already flutters</figcaption>
</figure>

## Snippets

Code Snippets were introduced from Xcode version 4 onwards, in the bottom right of the interface, and can be brought up with the shortcut cmd + ctrl + opt + 2. Code Snippets are templates of code: for common programming patterns Xcode abstracts the code into templates placed in Code Snippets, and when you need them you only have to type the shortcut to fill the template's contents into your code.

Typing `<#`xxx`#>` lets the region 'xxx' turn into a fill-in state, which is very useful when filling in snippets; this usage is everywhere in Xcode.

I recommend the <a href="https://github.com/mattt/Xcode-Snippets">Xcode-Snippets</a> project by mattt, which covers the great majority of code fragments used in everyday development.

This is considerably more convenient than using GitHub's Gist or the snippet collection tool bundled with Dash, because it is deeply bound to Xcode and lets you set shortcuts for fast completion, which is endlessly satisfying.

## Plugins

* <a href="https://github.com/onevcat/VVDocumenter-Xcode">VVDocumenter-Xcode</a> by our cat-god onevcat, with stars approaching 2000+, automatically generates a model of the method header documentation format, triggered with `///`

* <a href="https://github.com/omz/ColorSense-for-Xcode">ColorSense-for-Xcode</a>, which makes colour configuration visual

* <a href="https://github.com/holtwick/HOStringSense-for-Xcode">HOStringSense-for-Xcode</a>, which shows string lengths in normal mode and can automatically escape special characters

* <a href="https://github.com/stefanceriu/SCXodeMiniMap">SCXodeMiniMap</a>, which adds a SublimeText-like minimap — very cool

* <a href="https://github.com/questbeat/Lin-Xcode5">Lin-Xcode5</a>, which lets you index and edit localisation directly

* <a href="https://github.com/ksuther/KSImageNamed-Xcode">KSImageNamed-Xcode</a>, which automatically indexes and previews image files archived under `Images.xcassets` — very practical

* <a href="https://github.com/garnett/AutoresizeMask-for-Xcode">AutoresizeMask-for-Xcode</a>, which visualises `autoresizeMask` configuration

* <a href="https://github.com/JugglerShu/XVim">XVim</a>, a perfect port of vim mode, adding `:build` and `:run` for command-line aficionados. Personally I prefer the completely general emacs text editing mode on Mac, which together with sensibly placed shortcuts is more than enough to make development exceptionally convenient.

Plugins are installed at `~/Library/Application Support/Developer/Shared/Xcode/Plug-ins`; feel free to add or remove plugins to taste.

## Debugger

<a href="https://github.com/facebook/chisel">chisel</a> is an open-source tool from Facebook that enhances Xcode's debugger, LLDB.

### Installation

```bash
$ ~/.lldbinit
...
command script import /path/to/fblldb.py
```

It is advisable to keep all your configuration files in cloud storage and create symlinks in your home directory, so that nothing is lost even if you reinstall your machine, saving you trouble.

### Custom commands added

Command|Description
:---------------|:---------------
pviews                            |Recursively prints the description information of the views contained in keyWindow|
pvc                               |Recursively prints the description information of the ViewControllers contained in keyWindow|
visualize                         |Views a UIImage, UIView or CALayer using Preview.app on Mac|
fv                                |Finds views whose class name matches a regular expression in the view hierarchy|
fvc                               |Finds views whose class name matches a regular expression in the ViewController hierarchy|
show/hide                         |Shows and hides the given View or Layer. You can see the changes without any further processing|
mask/unmask                       |Marks out a View or Layer with a transparent rectangle|
border/unborder                   |Marks out a View or Layer with a visible rectangle|
caflush                           |Flushes the renderer (with no animation the actual effect is equivalent to "repaint")|
bmessage                          |Places a symbolic breakpoint on a class or instance method, without worrying about class inheritance|
wivar                             |Sets a watch point on an instance variable|
presponder                        |Prints the responder chain of the given object|
...                               |... and many more|

## More:

* NSHipter's latest article, <a href="http://nshipster.com/xcode-plugins/">Xcode Plugins</a>, introduces more and flashier plugins (NSHipter is becoming more and more boring; I suspect Mattt really has run out of things to write)
* Tangqiao provides an automated installation script for snippets in his open-source project <a href="https://github.com/tangqiaoboy/xcode_tool">Xcode-tool</a>
