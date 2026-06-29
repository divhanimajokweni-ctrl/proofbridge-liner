# Dynamic Tool Routing & JSON-RPC 2.0 Implementation

## Python Dynamic Tool Routing Loop (OpenAI Responses API + Pinecone RAG)

```python
        # ... continuation from your last cell
            {"role": "system", "content": "When prompted with a question, select the right tool to use based on the user's intent. Use PineconeSearchDocuments for specific medical questions mentioning the internal knowledge base."}
        ],
        tools=tools,
        parallel_tool_calls=True
    )
    
    # Check if the model decided to call any tools
    if response.choices[0].message.tool_calls:
        tool_calls = response.choices[0].message.tool_calls
        print(f"🛠️  **Model selected {len(tool_calls)} tool(s):** {[tc.function.name if tc.type == 'function' else tc.type for tc in tool_calls]}")
        
        # We append the model's tool call response to the message history
        input_messages.append(response.choices[0].message)
        
        for tool_call in tool_calls:
            # Case A: External custom function (Pinecone Vector Search)
            if tool_call.type == "function" and tool_call.function.name == "PineconeSearchDocuments":
                import json
                args = json.loads(tool_call.function.arguments)
                print(f"🧬 Executing Pinecone semantic search for query: '{args['query']}'")
                
                # Execute your query function defined earlier
                rag_results = query_pinecone_index(client, index, MODEL, args['query'])
                
                # Format match findings into a text context block
                context_str = "\n\n".join(
                    f"Document Match:\nQuestion: {m['metadata'].get('Question','')}\nAnswer: {m['metadata'].get('Answer','')}" 
                    for m in rag_results['matches']
                )
                
                input_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_call.function.name,
                    "content": context_str
                })
            
            # Case B: Built-in tool (Web Search Preview)
            # Note: The Responses API native tools often auto-resolve or require specific tool block returns 
            # depending on environment configuration. Here we log and handle manual orchestration mappings.
            elif tool_call.type == "web_search_preview":
                print("🌐 Activating native OpenAI Web Search Preview pipeline...")
                # Typically handled natively by the Responses API stack, or mock response fallback:
                input_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": "Web search preview data successfully populated via native runtime framework wrapper."
                })
        
        # Generate the final response using the compiled tool context
        final_response = client.responses.create(
            model="gpt-4o",
            input=input_messages,
            tools=tools
        )
        print("\n✨ **Final Answer:**")
        print(final_response.output_text)
        
    else:
        # If no tool was needed, print direct model output
        print("\n✨ **Direct Final Answer:**")
        print(response.output_text)
```

## Technical Architecture: Vector Routing in RAG

When this loop executes distinct evaluation queries, the agent processes inputs through a Retrieval-Augmented Generation (RAG) routing architecture:

### How Vector Routing Occurs

When a complex query about specific medical knowledge (e.g., the **7-year-old boy with sickle cell disease**) is processed, the model recognizes contextual triggers like *"according to the internal knowledge base"* and maps the intent directly to the `PineconeSearchDocuments` tool schema.

The application generates a fresh text embedding vector from the query text, executing mathematical comparison against the vector collection space within Pinecone:

- Dataset matches are scored by dot-product similarity
- Exact historical medical documents are retrieved based on semantic proximity
- Targeted context is wrapped inside a tool role message token block
- Context is fed back to `gpt-4o` for specialized, localized medical evaluation

This approach enables highly specialized responses without polluting the system's global parametric knowledge state.

## Node.js / TypeScript JSON-RPC 2.0 Transport (Codex App Server)

Complete production-ready stdio transport implementation:

```typescript
import { spawn } from "child_process";
import * as readline from "readline";

// --- Types & Interfaces ---

interface JsonRpcRequest {
  method: string;
  id?: number;
  params: Record<string, any>;
}

interface JsonRpcResponse {
  id?: number | null;
  method?: string; // Present in notifications
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  params?: any; // Present in notifications
}

// --- Server Spawn & Configuration ---

// Spawn Codex App Server defaulting to stdio transport
const proc = spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "inherit"],
});

const rl = readline.createInterface({ input: proc.stdout });

let nextId = 0;
let threadId: string | null = null;
let currentTurnId: string | null = null;

/**
 * Serializes and transmits a JSON-RPC message over standard input.
 */
const send = (method: string, params: Record<string, any>, expectResponse = true): number | null => {
  const message: JsonRpcRequest = { method, params };
  let assignedId: number | null = null;

  if (expectResponse) {
    assignedId = nextId++;
    message.id = assignedId;
  }

  proc.stdin.write(`${JSON.stringify(message)}\n`);
  console.log(`[CLIENT -> SERVER]: ${method} ${assignedId !== null ? `(ID: ${assignedId})` : "(Notification)"}`);
  return assignedId;
};

// --- Ingress Message Router ---

rl.on("line", (line) => {
  if (!line.trim()) return;

  try {
    const msg = JSON.parse(line) as JsonRpcResponse;

    // 1. Handle Server Notifications (No ID)
    if (msg.id === undefined || msg.id === null) {
      handleNotification(msg);
      return;
    }

    // 2. Handle Application Errors
    if (msg.error) {
      console.error(`[SERVER ERROR] Code ${msg.error.code}: ${msg.error.message}`);
      return;
    }

    // 3. Handle Method Responses
    handleResponse(msg);

  } catch (err) {
    console.error("[PARSER ERROR] Failed to parse payload line:", err);
  }
});

// --- Business Logic Handlers ---

/**
 * Manages downstream updates and events streamed during a Turn lifecycle.
 */
function handleNotification(msg: JsonRpcResponse) {
  const params = msg.params || {};

  switch (msg.method) {
    case "thread/started":
      console.log(`[EVENT] Thread registered successfully: ${params.thread?.id}`);
      break;

    case "thread/status/changed":
      console.log(`[STATUS] Thread ${params.threadId} shifted to state:`, params.status);
      break;

    case "turn/started":
      currentTurnId = params.turn?.id;
      console.log(`[EVENT] Turn generation lifecycle started. Turn ID: ${currentTurnId}`);
      break;

    case "item/started":
      console.log(`[STREAM] Item processing begun: Type "${params.item?.type || "unknown"}"`);
      break;

    case "item/agentMessage/delta":
      // Handles real-time incremental tokens streaming back from the model
      if (params.delta?.text) {
        process.stdout.write(params.delta.text);
      }
      break;

    case "item/completed":
      console.log(`\n[STREAM] Item completed sequence.`);
      break;

    case "turn/completed":
      console.log(`[EVENT] Turn finalized with status: "${params.turn?.status}"`);
      // Optional: Gracefully disconnect or start another turn iteration here
      break;

    case "thread/closed":
      console.log(`[EVENT] Thread ${params.threadId} has been successfully evicted from cache memory.`);
      break;

    default:
      console.log(`[NOTIFICATION UNHANDLED] Method: ${msg.method}`);
  }
}

/**
 * Tracks request/response matching for mandatory sequential primitives.
 */
function handleResponse(msg: JsonRpcResponse) {
  const result = msg.result;

  switch (msg.id) {
    case 0: // Match initialize
      console.log("[INIT] Handshake acknowledged by server target:", result?.platformOs, `(${result?.platformFamily})`);
      // Acknowledge synchronization with the mandatory initialized notification
      send("initialized", {}, false);
      
      // Step 2: Provision a fresh environment with a targeted modern model
      send("thread/start", {
        model: "gpt-5.4",
        cwd: process.cwd(),
        approvalPolicy: "never",
        sandbox: "workspaceWrite"
      });
      break;

    case 1: // Match thread/start
      if (result?.thread?.id) {
        threadId = result.thread.id;
        console.log(`[THREAD] Loaded Active Thread Context ID: ${threadId}`);

        // Step 3: Initiate a conversational Turn
        send("turn/start", {
          threadId: threadId,
          input: [{ 
            type: "text", 
            text: "Summarize this repo and check file structural configurations." 
          }]
        });
      }
      break;

    default:
      console.log(`[RESPONSE PACKET] Recieved Response ID ${msg.id}:`, JSON.stringify(result));
  }
}

// --- Process Management ---

proc.on("close", (code) => {
  console.log(`[PROCESS] Codex server child process exited with code ${code}`);
  process.exit(code ?? 0);
});

// --- Boot Routine Execution ---

// Step 1: Push client metadata block immediately upon opening stream channel
send("initialize", {
  clientInfo: {
    name: "my_product_integration",
    title: "Production Workspace Client",
    version: "1.0.0"
  },
  capabilities: {
    experimentalApi: true // Grants visibility access across explicit process and feature pools
  }
});
```

## Key Implementation Notes

| Component | Purpose |
|---|---|
| `send()` | Serializes JSON-RPC 2.0 messages to stdin with auto-incrementing IDs |
| `handleNotification()` | Processes server-pushed events (thread status, streaming deltas) |
| `handleResponse()` | Correlates responses to requests by ID for sequential handshake |
| `rl.on("line")` | Readline parser for line-delimited JSON frames over stdio |
| `proc.on("close")` | Process lifecycle cleanup |

### Protocol Flow

1. `initialize` → Server returns platform info
2. `initialized` (notification) → Client acknowledges
3. `thread/start` → Provisions fresh model context
4. `thread/started` (notification) → Thread ID received
5. `turn/start` → Begins conversational turn with input array
6. `item/agentMessage/delta` → Streaming token chunks
7. `turn/completed` → Turn lifecycle ends
8. `thread/closed` → Thread evicted from cache
