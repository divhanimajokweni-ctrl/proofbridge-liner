---
name: belt
description: "Use the belt CLI — run 250+ AI apps, manage knowledge, search skills, connect MCP servers"
allowed-tools: Bash(belt *)
---

## belt cli

belt is the cloud platform cli for ai agents. single ~4mb binary, no runtime dependencies.

### install

first check if belt is already installed:

```bash
which belt && belt --version
```

if not installed, download the installer and run it:

```bash
curl -fsSL https://cli.inference.sh -o /tmp/belt-install.sh && sh /tmp/belt-install.sh
```

then authenticate:

```bash
belt login
belt me
```

### apps — run 250+ ai models

```bash
belt app search "image"                      # find apps
belt app get openai/gpt-image-2              # view schema
belt app sample openai/gpt-image-2 --save in.json  # generate sample input
belt app run openai/gpt-image-2 --input in.json    # run it
belt app run openai/gpt-image-2 --input '{"prompt": "..."}' --save output.png
```

common apps:
- image: `openai/gpt-image-2`, `reve/create`, `pruna/p-image`
- upscale/edit: `pruna/p-image-upscale`, `pruna/p-image-edit`
- video: `google/veo-2`, `seedance/seedance-2-i2v`
- search: `tavily/search`, `exa/search`
- audio: `elevenlabs/tts`

### knowledge — persistent agent memory

```bash
belt know search "query"                  # semantic search
belt know list --type observation         # list by type
belt know get namespace/name              # get details
belt know create ./file.md --type concept # create from file
echo "learned X" | belt know create - --name x --type observation  # from stdin
belt know delete <id>
```

types: `skill`, `concept`, `observation`, `reference`, `preference`

### skills — reusable workflows

```bash
belt skill search "deployment"            # search registry
belt skill store --featured               # browse featured

# use on-demand (no install, stdout)
belt skill use namespace/skill-name       # from store
belt skill use github.com/user/repo       # from github
belt skill use user/repo --skill name     # pick from multi-skill repo

# install persistently
belt skill add namespace/skill-name       # auto-detects agents
belt skill add ns/name --agent claude-code
belt skill list                           # list installed

belt skill upload ./my-skill              # publish
```

### connectors — mcp servers

```bash
belt mcp list                             # available connectors
belt mcp search "slack"                   # search
belt mcp connect slack                    # connect
belt mcp tools slack                      # list tools
belt mcp run slack send_message --input '{"channel": "#general", "text": "hello"}'
```

### suggest — unified search

```bash
belt suggest "how to generate images"     # searches apps + skills + knowledge
```

### tips

- use `--json` for structured output when piping
- use `--save filename` to save media outputs directly
- `belt app sample` generates valid input — start there for unfamiliar apps
- `belt update` to get latest version
