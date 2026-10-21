---
layout: post
title: "On reusing TableViewCell"
description: "Tutorial"
category: "iOS"
comments: true
tags: ["iOS", "开发", "UITableView"]
machineTranslated: true
---

## Example

When creating a UITableViewCell, you should instantiate it in the following way.

```objc
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {

    NSString *CMainCell = [NSString stringWithFormat:@"Cell%d",indexPath.row];     //  0

    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CMainCell];      //   1
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault  reuseIdentifier: CMainCell];    //  2

        ...
    }

    // Adjust cell content
    cell.textLabel.text = @"XXX";    //  3

    ...

    return cell;
}
```

## How it works

In iOS, the list cells of a table view are continuously reused, which keeps performance reasonably high on mobile devices. The reuse mechanism is very common on mobile devices running Android as well; more on that later.

When the table view draws its list cells, assume the maximum number of cells that can fit on screen is 6. Since no cell objects have been created in memory at this point, the operation at step 2 must be performed to create them one by one. As the list starts scrolling up, the upper cell disappears and the lower cell reuses the cell object that already exists in memory.

However, if the cell contains a relatively complex view structure, such as a button, the corresponding creation process must be placed after step 2 rather than after step 3; otherwise overlapping views appear, because cells are continuously reused and the button created initially still exists.

So if we want to customise the content of each cell, we need to identify the cell uniquely — that is what `dequeueReusableCellWithIdentifier:CMainCell` does: it obtains the cell object through a unique identifier so it can be customised accordingly.

## Comparison with Android

In Android the list control is called a listview, and purely by name the Android definition is clearer and more precise.

The reuse of list cells in Android is very similar to iOS. The common approach is to create a viewholder to act as a cache for cells, and to give each cell a tag for unique identification.
