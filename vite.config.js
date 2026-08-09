import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: 'index.v21-clean.html',
            production: 'index.v21-production.html',
            health: 'health.v21.html',
            rollout: 'rollout.v21.html',
            context: 'context.v21.html',
            profile: 'profile.v21.html',
            billing: 'billing.v21.html',
            billing_cancel: 'billing-cancel.v21.html',
            billing_success: 'billing-success.v21.html',
            upgrade: 'upgrade.v21.html',
            invite: 'invite.v21.html',
            team: 'team.v21.html',
            saas_analytics: 'saas-analytics.v21.html',
            observability: 'observability.v21.html',
            feedback: 'feedback.v21.html',
            support: 'support.v21.html',
            beta_hub: 'beta-hub.v21.html',
            command_center: 'command-center.v21.html',
            super_admin: 'super-admin.v21.html',
            launch_readiness: 'launch-readiness.v21.html',
            enterprise: 'enterprise.v21.html',
            scale_ops: 'scale-ops.v21.html',
            ultimate_saas: 'ultimate-saas.v21.html',
            go_live: 'go-live.v21.html',
            final_stabilization: 'final-stabilization.v21.html',
            field_validation: 'field-validation.v21.html',
            real_services: 'real-services.v21.html',
            status: 'status.v21.html',
            incidents: 'incidents.v21.html',
            support_admin: 'support-admin.v21.html',
            beta: 'beta.v21.html',
            onboarding: 'onboarding.v21.html',
            login: 'login.v21.html',
            firestore_test: 'firestore-test.v21.html',
            storage_test: 'storage-test.v21.html',
            dashboard: 'dashboard.v21.html',
            documents: 'documents.v21.html',
            contract_detail: 'contract-detail.v21.html',
            owner_detail: 'owner-detail.v21.html',
            tenant_detail: 'tenant-detail.v21.html',
            property_detail: 'property-detail.v21.html',
            contracts: 'contracts.v21.html',
            owners: 'owners.v21.html',
            tenants: 'tenants.v21.html',
            properties: 'properties.v21.html'
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
});
