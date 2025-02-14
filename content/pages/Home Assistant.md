---
date: 2024-06-25
category: projects
keywords: home automation, home assistant, hass, hassio
tags:
- home assistant
title: Home Assistant
categories: projects
lastMod: 2025-02-14
---
# overview

[Home Assistant](https://www.home-assistant.io/) is essentially a home automation platform designed to be both accessible to users and powerful for enthusiasts. It is hosted on local hardware using software created by [Nabu Casa](https://www.nabucasa.com/) (who also maintain [ESPHome](https://esphome.io/index.html), a project I fully intend to utilize in the future). Home Assistant boasts a dedicated enterprise community that have developed a robust ecosystem of hardware and software compatible with Home Assistant right out of the box. Furthermore, through the [Home Assistant Community Store](https://hacs.xyz/) (colloquially HACS), users can install and run custom integrations, add-ons, and UI components created and maintained by Home Assistant's passionate user community.

My personal Home Assistant setup runs off of an old Dell Precision 5520 laptop that I used in college. The laptop's dedicated NVidia Quadro graphics card enables me to run local, high-intensive computing projects including AI and machine learning (more on that later). Nabu Casa's custom OS, [HASS](https://www.home-assistant.io/getting-started), is installed directly on the hardware, which enables tighter integration with the host system's hardware capabilities (something the containerized version of the software doesn't support).

# user interface

![image.png](/assets/image_1719365222919_0.png)

Home Assistant maintains a local server that, among other things, hosts the [lovelace](https://www.home-assistant.io/blog/2019/01/23/lovelace-released/) dashboard. Upon first opening, the user is greeted with a login screen. Assuming authentication succeeds, the above home page is displayed to the user. Immediately, multiple features can be noticed:

  + Front Door Snapshot is a continuous feed of snapshots from my front door camera on 3-second intervals. This allows me to quickly get a good idea of the conditions at home (such as weather, packages, etc - currently, my car is semi-disassembled in the driveway). Below the front door image, I have configured a dashboard to display data from a free weather API maintained by [Meteorologisk institutt](https://www.met.no/) as well as information on sunrise, sunset, moon phase, and more.
logseq.order-list-type:: number

  + At the top of the second column are buttons to interact with [Ada]({{< ref "/pages/Ada" >}}) via voice or via text. Below the Ada buttons, I created a dashboard to display my and my partner's statuses, including location (anonymized by named locations), battery percentage and status, and connectivity status. Beneath the status dashboard is an integration to display which cat's turn it is in bed tonight. I have two cats that don't get along, so they take turns in the bedroom at night. I created this widget to help me remember whose turn it is. At the bottom of the second column reside two indicators that appear when it is within two days of waste and recycling pickup. This is to ensure that I don't forget to take out the trash.
logseq.order-list-type:: number

  + The far right column contains a list of scripts to set whole-home light settings, including bright, dim, and dark. It also includes a switch for the outdoor lights, since they don't necessarily fit under any of the other dashboards.
logseq.order-list-type:: number

Speaking of *other dashboards*, notice the home, couch, computer, and bed icons on the top navigation bar. Each of these corresponds to a dashboard for a specific room in my house. I won't cover the intricate details of what's on those pages, but each includes controls for individual lighting elements in the room, shortcuts for lighting scenes, and media controls for devices in the room.

# automation

I have many automations set up on my Home Assistant server for multiple purposes. First, a series of automations control lighting in the house based on sunrise and sunset times as well as sunlight levels to maintain the optimal level of light for activity in the house. In addition, I have automations to manage my morning alarm, habit tracking, and location-based changes (turn off TV and lights when home is empty).

Scenes can be defined for further convenience in automating the state of one's home. Each scene is a snapshot of the states of your devices which can be reapplied at will. I have multiple scenes for each room as well as some for specific purposes like writing at my desk, working on a project outside, and more.

# devices

under construction
