#!/usr/bin/env bash
set -euo pipefail

stripe listen --forward-to localhost:8787/api/billing/stripe-webhook
