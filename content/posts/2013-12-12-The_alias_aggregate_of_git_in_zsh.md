---
layout: post
title: "zsh中git相关alias汇总"
description: "Tutorial"
category: "Tech"
comments : true
tags: [git, 工具, zsh]
---

妈妈再也不用担心我记不住git操作了

```bash

g=git

ga='git add'

gb='git branch'

gba='git branch -a'

gc='git commit -v'

'gc!'='git commit -v --amend'

gca='git commit -v -a'

'gca!'='git commit -v -a --amend'

gcl='git config --list'

gclean='git reset --hard && git clean -dfx'

gcm='git checkout master'

gcmsg='git commit -m'

gco='git checkout'

gcount='git shortlog -sn'

gcp='git cherry-pick'

gd='git diff'

gdc='git diff --cached'

gg='git gui citool'

gga='git gui citool --amend'

ggpnp='git pull origin $(current_branch) && git push origin $(current_branch)'

ggpull='git pull origin $(current_branch)'

ggpur='git pull --rebase origin $(current_branch)'

ggpush='git push origin $(current_branch)'

git-svn-dcommit-push='git svn dcommit && git push github master:svntrunk'

gk='gitk --all --branches'

gl='git pull'

glg='git log --stat --max-count=10'

glgg='git log --graph --max-count=10'

glgga='git log --graph --decorate --all'

glo='git log --oneline'

glp=_git_log_prettily

gm='git merge'

gmt='git mergetool --no-prompt'

gp='git push'

gpoat='git push origin --all && git push origin --tags'

gr='git remote'

grba='git rebase --abort'

grbc='git rebase --continue'

grbi='git rebase -i'

grh='git reset HEAD'

grhh='git reset HEAD --hard'

grmv='git remote rename'

grrm='git remote remove'

grset='git remote set-url'

grt='cd $(git rev-parse --show-toplevel || echo ".")'

grup='git remote update'

grv='git remote -v'

gsd='git svn dcommit'

gsr='git svn rebase'

gss='git status -s'

gst='git status'

gsta='git stash'

gstd='git stash drop'

gstp='git stash pop'

gsts='git stash show --text'

gunwip='git log -n 1 | grep -q -c wip && git reset HEAD~1'

gup='git pull --rebase'

gwc='git whatchanged -p --abbrev-commit --pretty=medium'

gwip='git add -A; git ls-files --deleted -z | xargs -0 git rm; git commit -m "wip"'

```
