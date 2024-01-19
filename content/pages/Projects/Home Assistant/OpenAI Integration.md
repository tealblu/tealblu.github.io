---
cdate:
- Oct 15th, 2023
date:
- Oct 15th, 2023
title: Projects/Home Assistant/OpenAI Integration
tags:
categories:
lastMod: 2023-12-28
---
Ethos:

  + Integrate OpenAI with Home Assistant for natural language interaction with smart home / devices

Resources

  + **11:32** quick capture:  [OpenAssist - ChatGPT Can Now Control Entities! - Share your Projects! / Custom Integrations - Home Assistant Community](https://community.home-assistant.io/t/openassist-chatgpt-can-now-control-entities/579000)

  + **11:38** quick capture:  [GitHub - Hassassistant/OpenAssist](https://github.com/Hassassistant/openassist)

  + **11:33** quick capture:  [Choosing index type and size](https://docs.pinecone.io/docs/choosing-index-type-and-size)

Code

  + OpenAI API Key: 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

  + PineconeDB Key: a6d09ddf-c4b4-4d78-92f3-320e6793869c

    + name: **default**

    + environment: gcp-starter

  + Home Assistant config additions:

```yaml
input_text:
  openassist_prompt:
    initial: ""
    max: 255

  pinecone_index:
    initial: ""
    max: 255

openassist:
  openai_key: "sk-...s1jz" #YOUR_OPENAI_KEY  
  pinecone_key: "b9a09c6a-...db2" #YOUR_PINECONE_ENVIRONMENT ID
  pinecone_env: "us-west1-gcp-free" #YOUR_PINECONE_ENVIRONMENT ID
  included_domains: "light, weather" #WHICH DOMAINS TO INCLUDE IN PINECONE DB

sensor:
  - platform: openassist
    your_name: "YOUR_NAME" #Optional if you want ChatGPT to know your name.
    mindsdb_model: "gpt4hass" #MINDSDB MODEL NAME.
    mindsdb_email: "your_email@mail.com"
    mindsdb_password: "Your_MindsDB_Password"
    notify_device: "alexa_media_office_echo" #Optional, this sends each ChatGPT response to your notify entity.
    #Can be any of your Notify entities. (Phone, Amazon Echo etc)

# If you need to debug any issues.
logger:
  default: info
  logs:
    custom_components.openassist: debug
```

    + domains to add:

      + automation

      + binary_sensor

      + button

      + camera

      + device_tracker

      + fan

      + light

      + media_player

      + number

      + person

      + scene

      + script

      + select

      + sensor

      + sun

      + switch

      + zone

mindsdb_cookie: eJyrVoovSC3KTcxLzStRsiopKk3VUUpMLsksS1WySkvMKQZyk_NzCxLzKuMzU5SsTEwMzI1MdZQy80pSi4AS8aXFqUVgGSVdQyUdJTgXrNC8FgAtPB9Y
