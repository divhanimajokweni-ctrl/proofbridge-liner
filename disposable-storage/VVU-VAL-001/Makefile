# VVU Validation Suite — Makefile
#
# Universal, zero-dependency task runner. Delegates to Taskfile.yml when
# `task` is available; falls back to direct script invocation otherwise.
#
# Usage:
#   make help          — list all targets
#   make rehearsal     — run the private dress rehearsal (compressed 72h)
#   make validate      — run the public 72-hour validation (real-time)
#   make freeze        — freeze the build (tag + digest pin)
#   make evidence      — generate a single hourly evidence bundle
#   make verify        — verify replay determinism against a bundle
#   make release       — publish the evidence package as a GitHub Release
#   make index         — compute the Validation Index from metrics
#   make sha256        — generate the SHA-256 manifest for all evidence

.DEFAULT_GOAL := help

# ── Configuration ──
VAL_ID       ?= VVU-VAL-001
RUNTIME_NS   ?= vvu-runtime
EVIDENCE_NS  ?= evidence
KUBECONTEXT  ?= default
HOUR         ?= 1
BUNDLE       ?= validation/$(VAL_ID)/evidence/bundles/Hour-01.zip

# ── Paths ──
VAL_DIR      := validation/$(VAL_ID)
CHAOS_DIR    := $(VAL_DIR)/chaos
REHEARSAL_DIR := $(VAL_DIR)/rehearsal
EVIDENCE_DIR := $(VAL_DIR)/evidence
GITHUB_DIR   := $(VAL_DIR)/github

# ── Detect task runner ──
TASK := $(shell command -v task 2>/dev/null)

.PHONY: help rehearsal validate freeze evidence verify release index sha256 clean

help: ## Show this help
	@echo "VVU Validation Suite — targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

rehearsal: ## Run the private dress rehearsal (compressed 72h in ~2min)
ifeq ($(TASK),)
	@echo "→ running rehearsal (direct script)"
	bash $(REHEARSAL_DIR)/run-rehearsal.sh
else
	@echo "→ running rehearsal (via task)"
	task rehearsal
endif

validate: ## Run the public 72-hour validation (real-time, requires frozen build)
ifeq ($(TASK),)
	@echo "→ running public validation (direct script)"
	BASH_ENV="" bash $(REHEARSAL_DIR)/run-rehearsal.sh --realtime
else
	task validate
endif

freeze: ## Freeze the build (git tag + container digest pin)
	@echo "→ freezing build for $(VAL_ID)"
	bash $(REHEARSAL_DIR)/freeze-build.sh
	@echo "✓ build frozen — commit hash and image digest recorded in $(VAL_DIR)/protocol/frozen-build.json"

evidence: ## Generate a single hourly evidence bundle (HOUR=1..72)
	@echo "→ generating evidence bundle for hour $(HOUR)"
	HOUR=$(HOUR) bash $(EVIDENCE_DIR)/bundle.sh $(HOUR)

verify: ## Verify replay determinism against a bundle (BUNDLE=path)
	@echo "→ verifying replay for $(BUNDLE)"
	bash $(EVIDENCE_DIR)/replay.sh --bundle "$(BUNDLE)"

release: ## Publish the evidence package as a GitHub Release
	@echo "→ publishing evidence package as GitHub Release"
	bash $(EVIDENCE_DIR)/archive.sh --release
	@echo "✓ release published — evidence assets attached to git tag $(VAL_ID)"

index: ## Compute the Validation Index from metrics (METRICS=path)
	@if [ -z "$$METRICS" ]; then \
		echo "usage: make index METRICS=path/to/metrics.json"; exit 2; \
	fi
	python3 $(EVIDENCE_DIR)/validation-index.py --metrics "$$METRICS"

sha256: ## Generate the SHA-256 manifest for all evidence bundles
	@echo "→ generating SHA-256 manifest"
	cd $(EVIDENCE_DIR)/bundles && sha256sum *.zip > ../SHA256SUMS
	@echo "✓ SHA256SUMS written to $(EVIDENCE_DIR)/SHA256SUMS"

clean: ## Remove generated evidence (does NOT remove committed source)
	@echo "→ cleaning generated evidence"
	rm -rf $(EVIDENCE_DIR)/bundles/ $(EVIDENCE_DIR)/SHA256SUMS $(EVIDENCE_DIR)/logs/
	@echo "✓ clean"
