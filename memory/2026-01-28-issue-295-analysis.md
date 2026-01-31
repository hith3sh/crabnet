# Memory 2026-01-28 - Issue #295 Analysis

---

## Tasks Completed

- [x] Issue #235 (HTML Blob QC) - Complete ✅
- [x] Issue #294 (Newsfeed v2) - Complete ✅
- [ ] Issue #295 (Finlex - Testing & Deployment) - Not started

---

## Issue #295: Newsfeed v2 - Test and Deploy Finlex

**Full Description:**
Test and deploy Finlex (Finnish legislation) for Newsfeed v2 content change detection.

**Parent Issue:** #294 (Newsfeed v2 - Add Finnish sources with content change detection)

**Spec Reference:** `docs/stories/newsfeed-v2-query-approach.md`

---

## Implementation Requirements

### 1. Test Finlex Table
- Check candidate documents for recent discovery
- Run newsfeed populator in dry-run mode
- Validate content change detection works
- Verify LLM enrichment produces appropriate summaries

### 2. Deploy Finlex
- Run newsfeed populator for real
- Monitor for errors or issues
- Validate content hash tracking
- Verify Azure Search updates work correctly

### 3. Documentation
- Document testing procedures
- Update deployment guides
- Record any issues found

---

## Current Status

- Issue #294 (Newsfeed v2) - ✅ Complete
  - Database migrations created
  - Model updates done
  - ETL processor implemented
  - CLI integration complete
  
- Issue #295 (Finlex) - 🔄 OPEN (Not Started)
  - Not assigned
  - No commits yet

---

## What This Involves

**Testing Finlex Table:**
The Finlex table contains Finnish legislation documents that need to be tested with the Newsfeed v2 content hash detection feature.

**Key Tasks:**
1. Verify database table structure (has `content_hash`, `as_of` columns)
2. Test newsfeed populator command: `bin/etl_runner.py newsfeed_populator finlex --dry-run`
3. Run full test: `bin/etl_runner.py newsfeed_populator finlex`
4. Validate content changes are detected correctly
5. Verify LLM summaries are generated
6. Check newsfeed items are created in `newsfeed_items` table

**Deployment:**
Once testing is successful, deploy to production environment:
1. Run newsfeed populator for Finlex in production (no --dry-run)
2. Schedule regular Finlex runs (via Airflow DAG or cron)
3. Monitor results and performance
4. Update documentation as needed

---

## Status

**Current Branch:** `feat/294-newsfeed-v2-content-hash` (all work committed)

---

## 🎯 Next Steps

Would you like me to:
1. **Start Issue #295** (Finlex testing)?
2. **Continue with Issue #294** (add more ETL features)?
3. **Merge Issue #294 to main** (newsfeed v2 ready for production)?

Let me know! 😼
