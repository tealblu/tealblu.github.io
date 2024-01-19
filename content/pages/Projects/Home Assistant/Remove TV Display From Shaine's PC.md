---
cdate:
- Oct 14th, 2023
tags:
- DONE
date:
- Oct 14th, 2023
title: Projects/Home Assistant/Remove TV Display From Shaine's PC
categories:
lastMod: 2023-12-28
---
Ethos:

  + Shaine's PC can't auto-detect when the TV changes input. When I cast to it, her PC doesn't realize that the display has changed input. It will sometimes open windows on the disabled TV display, and Shaine can't get to them.

  + I would like to be able to also use the Office TV (e.g. cast spotify now playing screen)

Part 1: Trigger on TV input swap

  + Two-part [automation](Automations
) : hdmi 1 -> cast , or cast -> hdmi 1

  + Trigger when the Office TV changes input

    + How to do that?

      + Cast input seems to be ID `43735`

        + Office TV active app = `RokuCast`

      + HDMI 1 (Shaine's PC) is `tvinput.hdmi1`

        + 

      + I *think* the home screen is `562859`

New idea: Install the Windows 11 optional feature Wireless Display on Shaine's PC, which may allow me to cast directly to Shaine's PC's third monitor (the Office TV)

  + Shaine will set Wireless Display as a startup app

    + {{< logseq/mark >}}This is what we did{{< / logseq/mark >}}
