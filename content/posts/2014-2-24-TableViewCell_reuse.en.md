---
layout: post
title: "On reusing TableViewCell"
description: "Tutorial"
category: "iOS"
comments: true
tags: ["iOS", "Development", "UITableView"]
machineTranslated: true
---

## How it works

In iOS, the list cells of a table view are continuously reused, which keeps performance reasonably high on mobile devices. The reuse mechanism is very common on mobile devices running Android as well; more on that later.

When the table view draws its list cells, assume the maximum number of cells that can fit on screen is 6. Since no cell objects have been created in memory at this point, the operation at step 2 must be performed to create them one by one. As the list starts scrolling up, the upper cell disappears and the lower cell reuses the cell object that already exists in memory.

However, if the cell contains a relatively complex view structure, such as a button, the corresponding creation process must be placed after step 2 rather than after step 3; otherwise overlapping views appear, because cells are continuously reused and the button created initially still exists.

Correction: this is where the original note went wrong. Building the reuse identifier from `indexPath.row` gives every row its own identifier, so `dequeueReusableCellWithIdentifier:` never finds a cell to reuse — `cell == nil` is true every time and a new cell is allocated for each row. Reuse breaks silently: small lists look fine, longer ones start to stutter and memory climbs.

The reuse identifier names a *kind* of cell, not an individual cell. Cells that share a layout share one identifier; the per-row differences go into the content assignment at step 3.

```objc
static NSString * const kMainCellIdentifier = @"MainCell";

- (UITableViewCell *)tableView:(UITableView *)tableView
         cellForRowAtIndexPath:(NSIndexPath *)indexPath {

    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kMainCellIdentifier];
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault
                                      reuseIdentifier:kMainCellIdentifier];
        // Complex subviews are created here, once.
    }

    // Reassign every time the cell is reused; never create subviews here.
    cell.textLabel.text = self.items[indexPath.row];
    return cell;
}
```

If rows genuinely need different layouts, define several identifiers and branch on the data type inside `cellForRowAtIndexPath:`, not on the row index.

## Comparison with Android

Android's older `ListView` also reused rows. A `ViewHolder` cached references to child views so the app did not have to call `findViewById` repeatedly. Later, `RecyclerView` made the ViewHolder pattern part of its adapter API. The underlying goal is the same as UIKit cell reuse: reuse the container, then update its content for the current data.
