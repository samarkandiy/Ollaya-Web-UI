API reference
ollaya serve exposes two APIs on http://localhost:11435:

the native API under /api/*, modelled on Ollama's, for decisions and model management;
the TypeSafe-compatible API under /v1/*, wire-identical to TypeSafe's, so existing TypeSafe SDKs work unchanged. See TypeSafe compatibility.
Method	Path	Purpose
GET, HEAD	/	Liveness: Ollaya is running
GET	/api/version	Server version
POST	/api/decide	Answer typed questions about a state; also load and unload a model
GET	/api/tags	Models on this machine
POST	/api/show	One model's details
GET	/api/ps	Models loaded in memory
POST	/api/pull	Download a model (streams progress)
DELETE	/api/delete	Remove a model
POST	/api/copy	Copy a model to a new name
POST	/api/create	Create a model from another one (streams progress)
POST	/v1/systemone	TypeSafe System One
POST	/v1/decisions	Alias of /v1/systemone
GET	/v1/models	TypeSafe model list
/api/push and /api/blobs/:digest are reserved and answer 501 NOT_IMPLEMENTED. Ollama's text endpoints (/api/generate, /api/chat, /api/embed) answer 404: decision models never generate text.

Conventions
JSON. Request and response bodies are JSON objects. The body is parsed as JSON whatever its Content-Type, so curl -d works as is. Requests are at most 8 MiB.
Field names are snake_case. Unknown request fields are ignored; null means absent.
Model names are [host/][namespace/]model[:tag], case-insensitive. A missing tag means latest. Responses always use the canonical form, such as laya:latest.
Numbers. Probabilities, confidences, score and noul are rounded to 4 decimal places. Durations are integers in nanoseconds; timestamps are RFC 3339 in UTC.
Streaming. /api/pull and /api/create stream newline-delimited JSON, one object per line, ending with exactly one {"status":"success"} or an error line. Send "stream": false for a single response.
Request IDs. Every response carries X-Request-Id, and /v1/* responses also x-typesafe-request-id. A valid client-sent X-Request-Id is echoed.
No implicit pulls. No endpoint downloads a model as a side effect. ollaya run pulls first; applications call /api/pull.
Errors
Every error, on every endpoint, has this body:

{
  "error": "model \"laya:xl\" not found, try pulling it first",
  "code": "MODEL_NOT_FOUND"
}

Field	Meaning
error	Human-readable message. Don't parse it; the one frozen message is model "<name>" not found, try pulling it first, as in Ollama.
code	Machine-readable code. Branch on this.
detail	Only for INVALID_REQUEST, TOO_MANY_OPTIONS and INPUT_TOO_LONG: every validation issue, in TypeSafe's (FastAPI's) ValidationError shape: loc, msg, type and sometimes ctx.
Code	HTTP	When	Retry
INVALID_JSON	400	Body missing, not JSON, or not an object	no
INVALID_REQUEST	422	Body fails validation; detail lists every issue	no
TOO_MANY_OPTIONS	422	A question's options don't fit the model's option budget	no
INPUT_TOO_LONG	422	state is longer than 65,536 tokens	no
UNAUTHORIZED	401	OLLAYA_API_KEY is set and the request lacks the key	no
FORBIDDEN	403	Browser Origin or Host header not allowed	no
MODEL_NOT_FOUND	404	Model (or a router's target) not on this machine; for a pull, not in the registry	no
NOT_FOUND	404	No such endpoint	no
METHOD_NOT_ALLOWED	405	Endpoint exists, method doesn't	no
OPERATION_IN_PROGRESS	409	A pull or create is writing the same model name	after it finishes
REQUEST_TOO_LARGE	413	Body over 8 MiB	no
QUEUE_FULL	503	OLLAYA_MAX_QUEUE requests already waiting; sent with Retry-After: 1	yes
MODEL_LOAD_FAILED	500	The model could not load (corrupt files, memory, OLLAYA_LOAD_TIMEOUT)	rarely
INFERENCE_FAILED	500	The runner failed during a decision	yes
STORAGE_ERROR	500	Disk full, permissions or I/O	no
INTERNAL	500	A bug; the server log has details under the request ID	yes
UNSUPPORTED_MODEL	501	This build can't run the model's format	no
NOT_IMPLEMENTED	501	Reserved endpoint	no
REGISTRY_ERROR	502	Registry unreachable or invalid	yes
DIGEST_MISMATCH	502	A download didn't match its sha256 and was discarded	yes
The set of codes is open: handle an unknown one by its HTTP status. A validation error lists every problem at once:

{
  "error": "state: Field required; questions.urgency.score.criteria: List should have at least 2 items after validation, not 1",
  "code": "INVALID_REQUEST",
  "detail": [
    {"loc": ["body", "state"], "msg": "Field required", "type": "missing"},
    {
      "loc": ["body", "questions", "urgency", "score", "criteria"],
      "msg": "List should have at least 2 items after validation, not 1",
      "type": "too_short",
      "ctx": {"field_type": "List", "min_length": 2, "actual_length": 1}
    }
  ]
}

Once a stream has started, a failure arrives as a last line in the same shape, such as {"error": "…", "code": "DIGEST_MISMATCH"}. Check each line for error before reading it as progress.

Questions
/api/decide, /v1/systemone and /api/create share one question schema, TypeSafe's. A request has 1–256 questions, keyed by any id; answers come back in the same order.

type	instructions	criteria	Answer
choice	optional	required: object label → description, or an array of labels; 2–255 options	choice, confidence, probabilities
score	optional	required: array of level descriptions, level 0 first; 2–10 levels	score, confidence, legend, probabilities
noul	optional	optional: {"true": "…", "false": "…"}	noul
instructions may be a string, an object, an array or null. When it is absent or null, the model reads the question id instead, so a descriptive id such as is_spam works on its own.
state is a string, an object or an array, up to 65,536 tokens. A state longer than the model's context is truncated to fit, and /api/decide reports state_truncated: true.
Model limits. Every option needs room in the model's context: about 125 options for laya:en (512 tokens) and 250 for laya:multilingual (1,024). More is 422 TOO_MANY_OPTIONS. For a router, the target's limits apply.
Answers are TypeSafe's shapes, in this field order:

type	Fields
choice	choice: the most likely label. confidence. probabilities: label → probability, in criteria order.
score	score: the expected level Σ i·pᵢ, which can fall between levels. confidence. legend: "0"… → the level's description. probabilities: "0"… → probability.
noul	noul: the probability that the statement holds. No confidence, as in TypeSafe.
confidence is TypeSafe's normalized top probability, (K · pmax − 1) / (K − 1) for K options: 0 when every option is equally likely, 1 when one option has all the probability. The formula is the same for every model, so thresholds transfer. Probabilities are calibrated with each model's temperatures. On a CUDA GPU the fp16 graph runs, whose answers can differ from fp32 on near-ties.

keep_alive
How long a model stays loaded after a request finishes, with Ollama's semantics:

Value	Meaning
"5m", "1h30m", "300ms", 300, "300"	Stay loaded this long after the request
0, "0", "0s"	Unload as soon as the request finishes
-1, "-5m", any negative value	Stay loaded until the server stops or an explicit unload
absent or null	OLLAYA_KEEP_ALIVE, default 5m
The timer starts when a request finishes, and the latest request's value wins. For a router it applies to the target that answered. /v1/* ignores keep_alive.

Decide
POST /api/decide

Answers typed questions about a state in one forward pass. The body is the /v1/systemone body plus native options; the response is TypeSafe's response plus native fields, so a TypeSafe client can parse it too.

Field	Type	Required	Notes
model	string	yes	Model name
state	string, object or array	yes to decide	Without it, the request loads or unloads the model (below)
questions	object	yes, unless the model has built-in questions	Replaces the model's own questions entirely
keep_alive	string or number	no	See keep_alive
extras	array of strings	no	["laya"] adds laya's own confidence and act probability to every answer
stream	boolean	no	Reserved; true is rejected
curl http://localhost:11435/api/decide -d '{
  "model": "laya",
  "state": "I was charged twice for my subscription this month. Please refund the second charge.",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this ticket?",
      "criteria": {
        "billing": "Payments, invoices and refunds",
        "technical": "Bugs, errors and outages",
        "account": "Login, profile and settings"
      }
    },
    "urgency": {
      "type": "score",
      "instructions": "How urgent is this ticket?",
      "criteria": ["Can wait", "Needs attention this week", "Needs attention today"]
    },
    "refund": {
      "type": "noul",
      "instructions": "The customer asks for money back.",
      "criteria": {"true": "Asks for a refund", "false": "Does not ask for a refund"}
    }
  },
  "keep_alive": "10m"
}'

{
  "model": "laya:en",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "billing",
      "confidence": 0.7781,
      "probabilities": {"billing": 0.8521, "technical": 0.0611, "account": 0.0868}
    },
    "urgency": {
      "type": "score",
      "score": 1.1982,
      "confidence": 0.3418,
      "legend": {"0": "Can wait", "1": "Needs attention this week", "2": "Needs attention today"},
      "probabilities": {"0": 0.1203, "1": 0.5612, "2": 0.3185}
    },
    "refund": {"type": "noul", "noul": 0.9127}
  },
  "usage": {"input_tokens": 118, "output_tokens": 0},
  "routing": {
    "router": "laya:latest",
    "model": "laya:en",
    "route": "english",
    "reason": "English Latin text"
  },
  "state_truncated": false,
  "done_reason": "decide",
  "created_at": "2026-09-24T09:30:12.418Z",
  "total_duration": 18734512,
  "load_duration": 0,
  "eval_duration": 16302117
}

Field	Meaning
model	The model that answered: for a router, its target (laya:en for a laya request)
answers	Question id → answer, in question order
usage	input_tokens read; output_tokens is always 0
routing	For a router: router, the chosen model, a stable route key and an informative reason. null otherwise.
state_truncated	true if part of the state was dropped to fit the model's context
done_reason	"decide", "load" or "unload"
created_at	When the response was produced
total_duration	Nanoseconds from receiving the request to the response, queueing included
load_duration	Nanoseconds spent waiting for the model to load; 0 when it was warm
eval_duration	Nanoseconds in the runner: tokenization, forward pass, calibration
With "extras": ["laya"], every answer also has a laya object: confidence (laya's entropy-based confidence) and act_probability (from the model's act head, or null).

Load and unload. A request without state and questions never decides. With no keep_alive, or a positive or negative one, it loads the model (every target, for a router) and returns done_reason: "load". With keep_alive: 0 it unloads it ("unload"). ollaya run preloads this way, and ollaya stop unloads.

curl http://localhost:11435/api/decide -d '{"model": "laya:en", "keep_alive": -1}'
curl http://localhost:11435/api/decide -d '{"model": "laya:en", "keep_alive": 0}'

A decision has no side effect on stored data, so it is safe to retry.

Routers
A router such as laya (laya:latest) has no weights: for each request it picks one of its targets, which then answers. laya reads only the state:

State	route	Answered by
English	english	laya:en
Mostly non-Latin script (Arabic, Cyrillic, CJK, …)	multilingual	laya:multilingual
Latin script, but not English (Turkish, German, …)	multilingual	laya:multilingual
No letters at all	english (the default)	laya:en
Routing costs microseconds. Branch on route, never on reason, whose wording may change. laya:typed-decisions is never picked by the router; request it directly.

List local models
GET /api/tags

The models on this machine, newest first. Each entry has name, model (the same), modified_at, size in bytes, digest (sha256 of the manifest, bare hex) and details: parent_model, format (onnx, gguf or router), family, families, parameter_size and quantization_level (the precisions it carries, such as F16/F32, or a GGUF model's quantization, such as Q8_0).

{
  "models": [
    {
      "name": "laya:en",
      "model": "laya:en",
      "modified_at": "2026-09-24T08:11:02.117Z",
      "size": 853634822,
      "digest": "bf30e4654e9483ff1e6a4fe6fb21b8a71baff6c8a01013046e7d13339020efd7",
      "details": {
        "parent_model": "",
        "format": "onnx",
        "family": "laya",
        "families": ["laya"],
        "parameter_size": "421M",
        "quantization_level": "F16/F32"
      }
    }
  ]
}

Show model details
POST /api/show

curl http://localhost:11435/api/show -d '{"model": "laya:en"}'

Field	Meaning
license	License text
modelfile	A Modelfile that recreates the model
parameters	Parameters set on the model, one name value per line, such as precision fp32
questions	Built-in questions, or null
router	For a router: strategy, default and routes (route → model). null otherwise.
details	As in /api/tags
model_info	general.architecture, general.languages, general.source (the pinned Hugging Face repository), plus family-specific keys such as laya.context_length
capabilities	Question types it answers (choice, score, noul), plus act if it has an act head
modified_at	As in /api/tags
A router is shown as itself, not resolved to a target.

List running models
GET /api/ps

The loaded models, sorted by name. Routers never appear; their loaded targets do. Each entry has name, model, size (memory, RAM plus VRAM), digest, details (with the precision actually loaded: F16 or F32, or a GGUF model's quantization), expires_at (when it will unload, or null when kept loaded), size_vram, context_length and device (cpu, cuda:0, metal, …).

Pull a model
POST /api/pull

{"model": "laya:en"}

Downloads the model into the local store and verifies every blob against its sha256. Pulling a router also pulls every model it routes to. Only the layers this machine needs are downloaded, blobs shared between models download once, and interrupted downloads resume.

The response streams progress, with Ollama's status strings:

{"status":"pulling manifest"}
{"status":"pulling 891102d37268","digest":"sha256:891102d372688fc2a094dac56a384bc537b87c63f21f9f3dac0be2b7cbc8d86c","total":842609210,"completed":420557117}
{"status":"pulling 891102d37268","digest":"sha256:891102d372688fc2a094dac56a384bc537b87c63f21f9f3dac0be2b7cbc8d86c","total":842609210,"completed":842609210}
{"status":"verifying sha256 digest"}
{"status":"writing manifest"}
{"status":"success"}

A model only appears in /api/tags after writing manifest. For a router there is one success, at the very end. A name that doesn't parse, a model that isn't in the registry and an unreachable registry are ordinary HTTP errors (422, 404, 502) before the stream starts, so curl --fail works. With "stream": false the response is {"status": "success"} when done. A second pull of the same name joins the one in flight. Safe to retry.

Delete a model
DELETE /api/delete

{"model": "triage"}

Removes the name, and the blobs no other model uses. A loaded model unloads once its requests finish; deleting a router keeps its targets. The response is 200 with an empty body, and 404 MODEL_NOT_FOUND when the name doesn't exist; after a timeout, treat that as success.

Copy a model
POST /api/copy

{"source": "laya:en", "destination": "my-guardrail"}

Copies a model to a new name, overwriting an existing destination. The response is 200 with an empty body.

Create a model
POST /api/create

The API behind ollaya create -f Modelfile: the CLI reads the Modelfile and the files it names and sends their contents as JSON.

Field	Type	Required	Notes
model	string	yes	Name to create
from	string	yes	A local model, possibly a router. It is never pulled.
questions	object	no	Built-in questions, validated like a decision request
calibration	object	no	temperature: up to 3 numbers (choice, score, noul). temperature_by_options: "<type>:<2|3-5|6-10|11+>" → number.
parameters	object	no	precision: "fp16" or "fp32", to pin one graph
license	string or array	no	License text(s)
description	string	no	One line, shown by /v1/models and ollaya show
stream	boolean	no	Default true
curl http://localhost:11435/api/create -d '{
  "model": "triage",
  "from": "laya:en",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this ticket?",
      "criteria": ["billing", "technical", "account"]
    }
  },
  "parameters": {"precision": "fp32"},
  "description": "Support ticket triage"
}'

The stream reports using existing layer sha256:… for each inherited layer, creating new layer sha256:… for each new one, then writing manifest and success. Layers are content-addressed, so repeating a create gives the same model.

Version
GET /api/version

{"version": "0.1.0"}

TypeSafe-compatible endpoints
Endpoint	Description
POST /v1/systemone	Request: model, state (required) and questions. Response: exactly model, answers and usage.
POST /v1/decisions	Alias of /v1/systemone
GET /v1/models	The local models, as {"models": [{"name", "description", "release_date"}]}
/v1/* ignores native fields such as keep_alive and extras, and never adds native fields to its responses. Errors use the same body as /api/*, which the TypeSafe SDK reads correctly. See TypeSafe compatibility.

Security
The server binds to 127.0.0.1:11435 and, like Ollama, trusts local callers. Binding it to another address (OLLAYA_HOST=0.0.0.0) lets everyone who can reach the port run decisions and pull, delete and create models, so:

OLLAYA_API_KEY makes every request except GET /, HEAD / and CORS preflight require Authorization: Bearer <key>; otherwise the answer is 401 UNAUTHORIZED. The TypeSafe SDK sends its key this way, and the ollaya CLI sends $OLLAYA_API_KEY. The server logs a warning when it listens beyond loopback without a key.
TLS is not terminated by the server; put a reverse proxy in front for remote access.
Browsers. Requests with an Origin header are allowed only from localhost, 127.0.0.1, 0.0.0.0 and [::1] (any port), app and editor webviews, and the origins in OLLAYA_ORIGINS (comma-separated, * wildcards). A loopback server also rejects unexpected Host headers, which blocks DNS rebinding.
Your data. States and questions are never logged and never echoed in errors.
Variable	Default	Effect
OLLAYA_HOST	127.0.0.1:11435	Bind address; the client's target. A loopback address also listens on [::1], so Windows programs reach a server in WSL at localhost without delay
OLLAYA_API_KEY	unset	Require Authorization: Bearer <key>
OLLAYA_ORIGINS	unset	Extra allowed browser origins
OLLAYA_KEEP_ALIVE	5m	Default keep_alive
OLLAYA_MAX_LOADED_MODELS	3	Loaded-model limit
OLLAYA_MAX_QUEUE	512	Requests in flight before 503 QUEUE_FULL
OLLAYA_LOAD_TIMEOUT	5m	Load deadline before 500 MODEL_LOAD_FAILED
OLLAYA_DEVICE	auto	auto, cpu, cuda or cuda:<n>
OLLAYA_MODELS	~/.ollaya/models	Model store
OLLAYA_REGISTRY	ollaya.dev	Default registry host in names