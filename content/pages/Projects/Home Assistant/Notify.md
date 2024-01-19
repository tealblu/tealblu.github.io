---
cdate:
- Oct 8th, 2023
tags:
- active
date:
- Oct 8th, 2023
title: Projects/Home Assistant/Notify
categories:
lastMod: 2023-12-28
---
Ethos

Project Definition

  + Goal: Implement smart home notification system

  + Technical specs:

    + The living room and the office MUST have a notification light in them

    + Notification lights must be obvious but not disrupting

    + Must be implemented in Home Assistant automations

Development

  + Automations
    + Automations have 3 core components:

      + Triggers

      + Conditions

      + Actions

    + Automations can call scripts

  + Light groups

    + `Group` integration can group lights/switches and control them as one entity

  + Scripts

    + Scripts can automate activities and perform logic

  + Structure

    + Make this as modular as possible

    + Basically, this will be a template and not an actual system

    + Automations are used as triggers that then call their individual scripts

      + e.g. litter box full triggers automation, automation calls script "LitterBoxFull_Notify", script performs action

    + Groups of lights can be set up to do the notifications?


      + e.g. group "litter box full" is all the devices grouped for the litter box notif

      + idk if this is actually needed

    + Helper device `notification_snooze` used as a global boolean to indicate snoozing

      + All scripts should start by setting the lock to `false`

      + All scripts should have a main loop that will exit if `notification_snooze` is set to true

      + Snooze script will set `notification_snooze` to true, which will disable all running notifications

    + Scripts should end with setting the notification lights to off
