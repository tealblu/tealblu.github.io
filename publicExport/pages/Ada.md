---
date: 2024-06-30
category: projects
keywords: ai
tags:
- ada
title: Ada
categories: projects
lastMod: 2024-06-30
---
# Teleology

After 5+ years of using Amazon's Alexa and Google's Assistant, I was left unsatisfied. Alexa is annoying at best. Google is constantly removing features from their Assistant. Enter [Home Assistant]({{< ref "/pages/Home Assistant" >}}) - with its built-in Assist platform, I set out to create a custom, local voice assistant. It is worth noting that HASS announced this year that they are working on their own local/cloud-integrated LLM system. I decided to do this project long before that was announced.

# Composition

Currently, Ada is put together using a number of components:

  + OpenAI's GPT-4o is the core of the system. Queries are sent via the OpenAI API to be processed by GPT-4o and returned as text.

  + OpenAI Whisper runs locally for speech-to-text transcription.

  + rHASSpy's Piper model runs locally for text-to-speech transcription.

Text queries are taken in via a number of different interfaces (voice, text, etc) and sent to Whisper for transcription. The transcribed text is formatted and sent to GPT-4o, along with text containing instructions and data regarding the Home Assistant's local devices and their controls. GPT-4o decides on an appropriate action and response, and sends it back to Home Assistant's conversation engine. If a response is generated, it is then turned into audio by Piper and played over the relevant interface, or it is displayed on screen, depending on context.

# Capability

Ada is currently capable of dual-mode input: both text and images can be processed dynamically depending on context. At the moment, images must come from either a local file, or a camera stream set up in Home Assistant. I only have one camera (front doorbell), but I intend to change that soon. I plan to install a number of cameras inside the house that Ada can query to gain context about what's happening at home. For example, I would like to be able to ask if the cat's litter box is full, if anyone is home, which pets are where, etc.

## Text interaction

Ada is capable of parsing complex intents from messages and executing them. See this conversation flow, where Ada correctly describes the status of the front door, even describing change over time. Ada also correctly described the weather for both camera frames as well as the current weather.

```text
[Ada text input window opened]
ada: How can I assist?

user: What's going on at the front door right now? And also tell me the weather.

ada: Both images show a view from a front door camera,
	 overlooking a yard with a flag and a car under a blue canopy.
	 In the first image, the weather appears sunny with clear skies,
     and a person is working on the car.
     In the second image, the weather is overcast, suggesting recent rain,
     and the person is not visible. The flag and surroundings remain consistent.
     The weather outside is currently cloudy.
```



# Inspiration

The name Ada comes from Ada Lovelace, one of the founders of computer science and one of my personal favorite historical figures.
