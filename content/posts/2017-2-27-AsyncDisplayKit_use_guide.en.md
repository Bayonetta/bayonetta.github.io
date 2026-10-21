---
layout: post
title: "AsyncDisplayKit learning notes"
description: "Tutorial"
category: "iOS"
comments: true
tags: [AsyncDisplayKit, Facebook, iOS, 开发]
machineTranslated: true
---

# Introduction

The core concept of AsyncDisplayKit is the node. `ASDisplayNode` is an abstraction based on UIView or CALayer, and looking at the corresponding header file basically shows that it integrates all view- and layer-related properties together.

* `layerBacked` can be set to build the node directly out of layers; by default it is an internal class of _ASDisplayView corresponding to the node

* It has its own layout engine, similar to CSS, and does not support Auto Layout

#### ASDisplayNode

* init

  * Can be called on any thread
  * Do not bind touch events or gestures here; put that in didLoad

* didLoad

  * Called on the main thread
  * Any UI-related operation and initialisation can be performed

* layoutSpecThatFits

  * Can be called on any thread
  * The main method for calculating layout
  * No UI-related operations or creation of other nodes may be performed, and there is no need to call super
  * In addition, the official recommendation is not to cache the layout; recalculate it each time where possible

* layout

  * Called on the main thread
  * Somewhat similar to viewWillLayoutSubviews; requires a call to the super method so that its own and its subnodes' layout calculations run
  * Suitable for basic UI settings such as hidden or background colour, but not for layout settings
  * If you need to set a UIView-related object, you can set its frame in layout, or preferably use the initWithViewBlock method and move it to a background process
  * The official example given is that making collectionNode fullscreen is a suitable use of the layout method

      subnode.frame = self.bounds;

#### ASViewController

A subclass of UIViewController; everything is main-thread operation

* init

  * Do not access self.view or self.node.view, as this forces the view to be initialised prematurely and may cause problems
  * It comes with an `initWithNode` method for initialisation; its own management of the node is similar to that of the view

* loadView

    * The official recommendation is not to use this method, because it is genuinely useless
    * Do not change the corresponding view object of self.view here, because calling the super method sets it onto node.view

* viewDidLoad

  * Do not write any layout logic

* viewWillLayoutSubviews

  * Called together with the node's layout method
  * Called when the node's bounds change (including rotation, split screen, keyboard appearance), and also when a child node changes
  * The official recommendation is to put layout logic here (code that does not strongly depend on size)

* viewWillAppear / viewDidDisappear

  * Suitable for logging user behaviour
  * Suitable for animated operations on the controller

# Usage

* Layout Specs

* Layout Element Properties

  * ASStackLayoutElement Properties
  * ASAbsoluteLayoutElement Properties
  * ASLayoutElement Properties

* Supports multiple forms of assignment

```objc
// dimension returned is relative (%)
ASDimensionMake(@"50%");
ASDimensionMakeWithFraction(0.5);

// dimension returned in points
ASDimensionMake(@"70pt")
ASDimensionMake(70);
ASDimensionMakeWithPoints(70);
```

* Batch Fetching API

  The official method for prefetching, used to implement infinite scrolling

```objc
-tableNode:willBeginBatchFetchWithContext:
-collectionNode:willBeginBatchFetchWithContext:
```

* `ASDisplayNode` is the ancestor class of all nodes.

* When updating the layout, remember to call setNeedsLayout

* The `automaticallyManagesSubnodes` method manages child nodes automatically, so you no longer have to addSubNode manually

* `inverted` can invert the NSIndexPath of an entire tableNode or collectionNode, so the bottommost cellNode becomes NSIndexPath(0, 0), which is far more convenient for chat-style apps, for example

* `imageModificationBlock` is a block of ImageNode that allows post-processing, such as rounded-corner cropping

* `shouldRasterizeDescendants` rasterises the subtree, meaning that, similar to VVebo, all node levels within a point are drawn onto a single layer

* `neverShowPlaceholders` draws cellNode synchronously, and the main thread blocks until the interface has finished drawing

* Take care when subclassing a custom `ASViewController` or `ASDisplayNode`, because the difference between them is very subtle

* ASImageNode, ASButtonNode and ASTextNode are all subclasses of ASControlNode; you can use `addTarget(self, action: "handleXXX", forControlEvents: .TouchUpInside)` to add click response handlers to them directly, rather than using addGesture and the like

* ASImageNode is an excellent replacement for UIImageView: ASImageNode renders the UIImage on a background thread and then presents the image on the main thread. ASImageNode can therefore greatly improve FPS.

  For local images, you can assign a UIImage instance directly to ASImageNode.image.

  For network images, you should use ASNetworkImageNode, and you need to specify an ImageManager for ASNetworkImageNode to manage network requests, image caching and the like

* The hitTestSlop property can enlarge the clickable response area

* enableHitTestDebug

  ADK provides a great many debug features; this one is for the response area, and the clickable area turns green

# FAQ

* Common errors

  * Accessing node.view in the `-init:` method is forbidden
  * Make sure you access the data source outside the node block
  * viewBlocks should avoid retain cycles

* Common conceptual misunderstandings

  * ASCellNode is not reused
  * LayoutSpecs are executed each time layout is called
  * AsyncDisplayKit has its own powerful layout API, whose usage differs greatly from the system API

* Common performance problem scenarios
  * Avoid the `cornerRadius` property (as well as `shadowPath`, `border` and `mask`)
  * ASDK does not support Auto Layout
  * The pointer to ASDisplayNode is kept alive (allegedly the same as in the system, where when a layer is added to a UIView's super layer it is retained indefinitely, even if the layer's delegate is set to weak)

* Corner Rounding

  The official website has an article analysing and optimising rounded corners; see the documentation for specifics
