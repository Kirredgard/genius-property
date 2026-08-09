#!/usr/bin/env bash
set -euo pipefail

stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
