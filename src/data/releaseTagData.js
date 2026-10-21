export const INITIAL_RELEASE_TAGS_DATA = {
  'Nov-R2': {
    tagName: 'Nov-R2',
    targetDate: '2026-11-20',
    foundationVersion: '1.315.654',
    status: 'Ready',
    lastSynced: 'Just now',
    syncSource: 'VersionOne Enterprise',
    stories: [
      {
        id: 'V1-1042',
        source: 'VersionOne',
        type: 'Story',
        title: 'Asynchronous claim valuation event streaming pipeline',
        repository: 'Claims Gateway',
        assignee: { name: 'Sarah Chen', initials: 'SC', avatarBg: '#3b82f6' },
        priority: 'High',
        storyPoints: 8,
        status: 'Done',
        sprint: 'Sprint 44 - Core Payments & Claims',
        epic: 'Enterprise Claims Fast-Track',
        regressionImpact: 'Low',
        lastUpdated: 'Today 11:40 AM'
      },
      {
        id: 'V1-8491',
        source: 'VersionOne',
        type: 'Story',
        title: 'Producer Portal OAuth2 token refresh & session revocation',
        repository: 'Producer Portal',
        assignee: { name: 'Amil Ali', initials: 'AA', avatarBg: '#059669' },
        priority: 'Highest',
        storyPoints: 5,
        status: 'In QA',
        sprint: 'Sprint 44 - Core Payments & Claims',
        epic: 'Portal Modernization',
        regressionImpact: 'Medium',
        lastUpdated: 'Yesterday'
      },
      {
        id: 'V1-1055',
        source: 'VersionOne',
        type: 'Bug',
        title: 'Deadlock on simultaneous agency rating calculation requests',
        repository: 'Agency API',
        assignee: { name: 'David Kumar', initials: 'DK', avatarBg: '#d97706' },
        priority: 'High',
        storyPoints: 3,
        status: 'Ready for Test',
        sprint: 'Sprint 44 - Core Payments & Claims',
        epic: 'Core Service Reliability',
        regressionImpact: 'High',
        lastUpdated: 'Oct 14'
      },
      {
        id: 'V1-1078',
        source: 'VersionOne',
        type: 'Story',
        title: 'High-volume push notification batching for claims status',
        repository: 'Notification Service',
        assignee: { name: 'Elena Rostova', initials: 'ER', avatarBg: '#8b5cf6' },
        priority: 'Medium',
        storyPoints: 5,
        status: 'Done',
        sprint: 'Sprint 43 - Messaging Engine',
        epic: 'Omnichannel Customer Alerts',
        regressionImpact: 'Low',
        lastUpdated: 'Oct 13'
      },
      {
        id: 'V1-8512',
        source: 'VersionOne',
        type: 'Task',
        title: 'Customer Portal responsive policy document preview upgrade',
        repository: 'Customer Portal',
        assignee: { name: 'Marcus Vance', initials: 'MV', avatarBg: '#ec4899' },
        priority: 'Medium',
        storyPoints: 3,
        status: 'In Progress',
        sprint: 'Sprint 44 - Core Payments & Claims',
        epic: 'Self-Service Claims Portal',
        regressionImpact: 'Low',
        lastUpdated: '2 hours ago'
      },
      {
        id: 'V1-1090',
        source: 'VersionOne',
        type: 'Story',
        title: 'Zero-downtime policy ledger database migration schema',
        repository: 'Policy Admin Engine',
        assignee: { name: 'Alex Wong', initials: 'AW', avatarBg: '#0284c7' },
        priority: 'Highest',
        storyPoints: 8,
        status: 'Done',
        sprint: 'Sprint 43 - Messaging Engine',
        epic: 'Foundation 1.315 Compatibility',
        regressionImpact: 'High',
        lastUpdated: 'Oct 12'
      },
      {
        id: 'V1-1094',
        source: 'VersionOne',
        type: 'Bug',
        title: 'Payment Gateway webhook idempotency key deduplication bug',
        repository: 'Payment Gateway',
        assignee: { name: 'Priya Patel', initials: 'PP', avatarBg: '#10b981' },
        priority: 'Highest',
        storyPoints: 2,
        status: 'Done',
        sprint: 'Sprint 44 - Core Payments & Claims',
        epic: 'Payment Security & Audit',
        regressionImpact: 'Medium',
        lastUpdated: 'Yesterday'
      }
    ],
    regressionSuite: {
      status: 'Active',
      testSuiteName: 'Release Nov-R2 Staging Full Regression Suite #B489',
      environment: 'Staging (pre-prod-us-east-1)',
      passRate: 88,
      totalTests: 164,
      passed: 142,
      failed: 3,
      blocked: 1,
      inProgress: 18,
      lastRunTimestamp: 'Oct 15, 2024 10:45 AM (automated Jenkins #458)',
      issues: [
        {
          id: 'REG-104',
          title: 'Claims Gateway timeout under concurrent token validation (>500 rps)',
          severity: 'High',
          status: 'Investigating',
          component: 'Claims Gateway',
          detectedInRun: 'Run #B489-02',
          owner: 'Arch Team'
        },
        {
          id: 'REG-109',
          title: 'Staging webhook callback retry delay exceeds 15s backoff window',
          severity: 'Medium',
          status: 'Patch Deployed',
          component: 'Notification Service',
          detectedInRun: 'Run #B489-01',
          owner: 'Ops SRE'
        }
      ]
    },
    validationSteps: [
      {
        id: 'val-1',
        name: 'Pre-flight Unit & Integration Test Automation',
        category: 'Testing',
        description: 'Ensure 100% test coverage target (>85%) met across all microservices in scope.',
        status: 'Passed',
        owner: 'QA Automation Lead',
        verifiedAt: 'Oct 15, 2024 09:15 AM',
        evidence: 'SonarQube & JaCoCo coverage: 89.2% passed'
      },
      {
        id: 'val-2',
        name: 'SAST & Security Compliance Clearance',
        category: 'Security',
        description: 'Veracode static analysis and dependency vulnerability scans clear of critical/high CVEs.',
        status: 'Passed',
        owner: 'SecOps Team',
        verifiedAt: 'Oct 15, 2024 09:40 AM',
        evidence: 'Zero Sev-1 / Sev-2 open findings'
      },
      {
        id: 'val-3',
        name: 'End-to-End Regression & Sanity Verification',
        category: 'Quality Gate',
        description: 'Automated test suite and exploratory sanity testing on Staging environment.',
        status: 'In Progress',
        owner: 'DevOps / QA',
        verifiedAt: 'Running - 88% complete',
        evidence: 'Automated Jenkins Pipeline #B489 active'
      },
      {
        id: 'val-4',
        name: 'Database Migration & Schema Compatibility Check',
        category: 'Architecture',
        description: 'Verify backward-compatible Liquibase changes run without table locks on staging replica.',
        status: 'Passed',
        owner: 'DBA Arch Team',
        verifiedAt: 'Oct 14, 2024 04:30 PM',
        evidence: 'Migration execution time: 1.4s · zero table lock'
      },
      {
        id: 'val-5',
        name: 'Performance Benchmark & Latency Verification',
        category: 'Performance',
        description: 'Validate API 99th percentile response time remains under 180ms under baseline peak load.',
        status: 'Passed',
        owner: 'Performance Eng',
        verifiedAt: 'Oct 15, 2024 08:30 AM',
        evidence: 'K6 load test: p99 = 142ms, Error rate: 0.01%'
      },
      {
        id: 'val-6',
        name: 'Production Runbook & Rollback Procedure Sign-off',
        category: 'Operations',
        description: 'Rollback scripts verified with automated canary rollback gates configured in ArgoCD.',
        status: 'Passed',
        owner: 'Ops SRE',
        verifiedAt: 'Oct 14, 2024 06:10 PM',
        evidence: 'Canary rollback simulated and signed off'
      },
      {
        id: 'val-7',
        name: 'Change Advisory Board (CAB) & Release Sign-off',
        category: 'Governance',
        description: 'Final authorization from CAB committee and primary stakeholders before production deploy.',
        status: 'Pending',
        owner: 'Release Manager (Amil Ali)',
        verifiedAt: 'Scheduled for CAB review',
        evidence: 'Change Request CHG123456 linked'
      }
    ]
  },
  'Release 2024.10': {
    tagName: 'Release 2024.10',
    targetDate: '2024-10-18',
    foundationVersion: '1.315.654',
    status: 'Ready',
    lastSynced: '10m ago',
    syncSource: 'VersionOne Enterprise',
    stories: [
      {
        id: 'V1-992',
        source: 'VersionOne',
        type: 'Story',
        title: 'Claims Gateway foundation 1.315 upgrade and backward compatibility',
        repository: 'Claims Gateway',
        assignee: { name: 'Sarah Chen', initials: 'SC', avatarBg: '#3b82f6' },
        priority: 'Highest',
        storyPoints: 8,
        status: 'Done',
        sprint: 'Sprint 43 - Oct Release',
        epic: 'Foundation Baseline Modernization',
        regressionImpact: 'Low',
        lastUpdated: 'Oct 13'
      },
      {
        id: 'V1-8310',
        source: 'VersionOne',
        type: 'Story',
        title: 'Agency rating response cache optimization with Redis Cluster',
        repository: 'Agency API',
        assignee: { name: 'David Kumar', initials: 'DK', avatarBg: '#d97706' },
        priority: 'High',
        storyPoints: 5,
        status: 'Done',
        sprint: 'Sprint 43 - Oct Release',
        epic: 'API Performance Sprint',
        regressionImpact: 'Low',
        lastUpdated: 'Oct 12'
      },
      {
        id: 'V1-998',
        source: 'VersionOne',
        type: 'Bug',
        title: 'Fix producer portal session expiration modal race condition',
        repository: 'Producer Portal',
        assignee: { name: 'Amil Ali', initials: 'AA', avatarBg: '#059669' },
        priority: 'High',
        storyPoints: 3,
        status: 'Done',
        sprint: 'Sprint 43 - Oct Release',
        epic: 'Security & Stability',
        regressionImpact: 'Medium',
        lastUpdated: 'Oct 14'
      }
    ],
    regressionSuite: {
      status: 'Passed',
      testSuiteName: 'Release 2024.10 Final Staging Regression Suite #B452',
      environment: 'Staging US-East-1',
      passRate: 100,
      totalTests: 182,
      passed: 182,
      failed: 0,
      blocked: 0,
      inProgress: 0,
      lastRunTimestamp: 'Oct 14, 2024 08:30 PM (Jenkins #452)',
      issues: []
    },
    validationSteps: [
      {
        id: 'val-1',
        name: 'Pre-flight Unit & Integration Test Automation',
        category: 'Testing',
        description: 'Full automated unit test execution pass.',
        status: 'Passed',
        owner: 'QA Automation Lead',
        verifiedAt: 'Oct 14, 2024 10:00 AM',
        evidence: 'All 480 tests green'
      },
      {
        id: 'val-2',
        name: 'SAST & Security Clearance',
        category: 'Security',
        description: 'Vulnerability scans clear.',
        status: 'Passed',
        owner: 'SecOps Team',
        verifiedAt: 'Oct 14, 2024 02:00 PM',
        evidence: 'Zero critical issues'
      },
      {
        id: 'val-3',
        name: 'End-to-End Regression Verification',
        category: 'Quality Gate',
        description: '100% regression suite pass on Staging.',
        status: 'Passed',
        owner: 'DevOps / QA',
        verifiedAt: 'Oct 14, 2024 08:30 PM',
        evidence: 'Suite #B452 passed'
      }
    ]
  }
};

export function getReleaseTagData(tagName, fallbackPlan = {}) {
  const existing = INITIAL_RELEASE_TAGS_DATA[tagName];
  if (existing) return existing;

  // Generate sensible defaults for dynamically added tags
  return {
    tagName: tagName || 'Untitled Tag',
    targetDate: fallbackPlan.targetDate || '',
    foundationVersion: fallbackPlan.finalFoundationVersion || '1.315.654',
    status: fallbackPlan.status || 'Planning',
    lastSynced: 'Just now',
    syncSource: 'VersionOne Enterprise',
    stories: [
      {
        id: `V1-${Math.floor(1000 + Math.random() * 9000)}`,
        source: 'VersionOne',
        type: 'Story',
        title: `Release scope integration for ${tagName || 'new tag'}`,
        repository: 'Claims Gateway',
        assignee: { name: 'Amil Ali', initials: 'AA', avatarBg: '#3b82f6' },
        priority: 'High',
        storyPoints: 5,
        status: 'In Progress',
        sprint: 'Current Sprint',
        epic: 'Release Alignment',
        regressionImpact: 'Low',
        lastUpdated: 'Just now'
      },
      {
        id: `V1-${Math.floor(8000 + Math.random() * 1000)}`,
        source: 'VersionOne',
        type: 'Task',
        title: `Foundation baseline synchronization & service tests`,
        repository: 'Notification Service',
        assignee: { name: 'Sarah Chen', initials: 'SC', avatarBg: '#10b981' },
        priority: 'Medium',
        storyPoints: 3,
        status: 'To Do',
        sprint: 'Current Sprint',
        epic: 'Foundation 1.315',
        regressionImpact: 'Low',
        lastUpdated: 'Today'
      }
    ],
    regressionSuite: {
      status: 'Active',
      testSuiteName: `Automated Regression Suite for ${tagName}`,
      environment: 'Staging US-East-1',
      passRate: 92,
      totalTests: 120,
      passed: 110,
      failed: 2,
      blocked: 0,
      inProgress: 8,
      lastRunTimestamp: 'Automated test suite scheduled',
      issues: [
        {
          id: 'REG-201',
          title: `Initial sanity check regression item for ${tagName}`,
          severity: 'Medium',
          status: 'Investigating',
          component: 'Agency API',
          detectedInRun: 'Run #B1',
          owner: 'QA Team'
        }
      ]
    },
    validationSteps: [
      {
        id: 'val-1',
        name: 'Automated Unit & Integration Tests',
        category: 'Testing',
        description: 'Verify all microservices pass unit tests.',
        status: 'Passed',
        owner: 'QA Automation',
        verifiedAt: 'Today',
        evidence: 'CI pipeline verified'
      },
      {
        id: 'val-2',
        name: 'End-to-End Regression Gate',
        category: 'Quality Gate',
        description: 'Verify no regression defects are open.',
        status: 'In Progress',
        owner: 'DevOps',
        verifiedAt: 'In Progress',
        evidence: 'Regression pipeline active'
      },
      {
        id: 'val-3',
        name: 'CAB & Release Manager Sign-off',
        category: 'Governance',
        description: 'Final sign-off before deployment window.',
        status: 'Pending',
        owner: 'Release Manager',
        verifiedAt: 'Pending',
        evidence: 'Pending final review'
      }
    ]
  };
}
