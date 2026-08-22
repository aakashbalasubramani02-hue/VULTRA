#!/usr/bin/env python3
import argparse
import csv
import json
import sys
from pathlib import Path
from dataclasses import replace

from src.data_loader import load_vulnerabilities, load_profiles, load_gold_set
from src.schema_validator import validate_vulnerabilities, validate_profiles, validate_gold
from src.ranker import rank_personalized, rank_by_cvss
from src.models import WeightModifiers, serialise, MatchOutcome
from src.evaluator import evaluate
from src.explainer import explain_vulnerability
from src.reporter import render_ranking, write_report


def context():
    """Load primary data context."""
    v = load_vulnerabilities()
    p = load_profiles()
    g = load_gold_set()
    return v, p, g


def get_org(profiles, org_id):
    """Find organisation profile by ID."""
    for p in profiles:
        if p.org_id.upper() == org_id.upper():
            return p
    raise ValueError(f"Unknown organisation ID: {org_id}")


def output_ranking(r, args):
    """Format and display ranking output in text, JSON, or CSV."""
    rows = r.ranked if args.all else r.ranked[:args.top]

    if args.format == 'json':
        payload = {
            'organisation': serialise(r.organisation),
            'total_evaluated': r.total_evaluated,
            'relevant_count': len(r.ranked),
            'excluded_count': len(r.excluded),
            'needs_verification_count': len(r.needs_verification),
            'ranking': [serialise(x) for x in rows],
            'evidence_policy': 'Source values and provenance are retained in each vulnerability record.',
        }
        print(json.dumps(payload, indent=2))
        return

    if args.format == 'csv':
        w = csv.writer(sys.stdout)
        w.writerow([
            'rank',
            'cve_id',
            'product_name',
            'priority',
            'confidence',
            'cvss',
            'cisa_kev',
            'first_epss',
            'exposure',
            'importance',
            'final_score_100',
            'kev_pts',
            'epss_pts',
            'cvss_pts',
            'exposure_pts',
            'importance_pts',
            'action',
        ])
        for x in rows:
            v = x.vulnerability
            b = x.breakdown
            f = b.factors_100 or {}
            tech = x.match.matched_technology
            exp = tech.exposure if tech else 'internal'
            imp = tech.importance if tech else 'normal'
            act = x.explanation.safe_next_action if x.explanation else ''
            w.writerow([
                x.rank,
                v.cve_id,
                v.product_name,
                x.priority.value,
                x.confidence.value,
                v.cvss_base_score,
                v.cisa_kev,
                v.first_epss,
                exp,
                imp,
                f'{b.score_100:.1f}',
                f'{f.get("kev", 0):.1f}',
                f'{f.get("epss", 0):.1f}',
                f'{f.get("cvss", 0):.1f}',
                f'{f.get("exposure", 0):.1f}',
                f'{f.get("importance", 0):.1f}',
                act,
            ])
        return

    print(render_ranking(r, len(rows)))


def audit(v, p, g):
    """Run data integrity and cross-dataset audit."""
    products = {x.product_name for x in v}
    unique_cves = {x.cve_id for x in v}
    dup = len(v) - len({(x.cve_id, x.product_name, x.cvss_base_score, x.cisa_kev, x.first_epss) for x in v})
    unmatched_gold = validate_gold(g, v)
    v_issues = validate_vulnerabilities(v)
    p_issues = validate_profiles(p)

    all_org_prods = {t.product for org in p for t in org.technologies} or {cp for org in p for cp in org.critical_products}
    matched_prods = products & all_org_prods

    print("DATASET AUDIT")
    print("=============")
    print(f"Vulnerabilities : rows={len(v)}, unique CVEs={len(unique_cves)}, unique products={len(products)}, duplicate rows={dup}")
    print(f"Signals Range   : CVSS={min(x.cvss_base_score for x in v):.1f}-{max(x.cvss_base_score for x in v):.1f}, "
          f"EPSS={min(x.first_epss for x in v):.5g}-{max(x.first_epss for x in v):.5g}, "
          f"KEV count={sum(1 for x in v if x.cisa_kev)}")
    print(f"Validation      : Vulnerability issues={len(v_issues)}, Profile issues={len(p_issues)}")
    print(f"Profiles ({len(p)})   : " + ", ".join(f"{x.org_id} ({x.name}: {len(x.technologies)} techs)" for x in p))
    print(f"Gold Benchmark  : rows={len(g)}, unmatched against dataset={len(unmatched_gold)}")
    print(f"Inventory Match : {len(matched_prods)}/{len(products)} products mapped to active organization profiles")


def main():
    ap = argparse.ArgumentParser(description='VULTRA — Personalised Vulnerability Decision Intelligence')
    sub = ap.add_subparsers(dest='cmd', required=True)

    for name in ['audit', 'profiles', 'quality']:
        sub.add_parser(name)

    def organisation_cmd(name):
        x = sub.add_parser(name)
        x.add_argument('--org', required=True, help='Organisation ID (e.g. ORG-001)')
        return x

    an = organisation_cmd('analyze')
    an.add_argument('--all', action='store_true', help='Show all ranked items instead of top N')
    an.add_argument('--top', type=int, default=5, help='Number of top actions to show (default: 5)')
    an.add_argument('--format', choices=['text', 'json', 'csv'], default='text')

    ev = organisation_cmd('evidence')
    ev.add_argument('--cve', required=True, help='CVE identifier to inspect (e.g. CVE-2025-5380)')

    organisation_cmd('why-not')
    organisation_cmd('compare')
    organisation_cmd('evaluate')

    wi = organisation_cmd('what-if')
    wi.add_argument('--cvss-weight', type=float, help='Simulated CVSS weight')
    wi.add_argument('--kev-weight', type=float, help='Simulated KEV weight')
    wi.add_argument('--epss-weight', type=float, help='Simulated EPSS weight')
    wi.add_argument('--exposure-weight', type=float, help='Simulated Exposure weight')
    wi.add_argument('--importance-weight', type=float, help='Simulated Importance weight')

    co = sub.add_parser('compare-orgs')
    co.add_argument('--org1', required=True, help='First organisation ID')
    co.add_argument('--org2', required=True, help='Second organisation ID')

    organisation_cmd('report')

    args = ap.parse_args()

    try:
        v, p, g = context()

        if args.cmd == 'audit':
            audit(v, p, g)
            return

        if args.cmd == 'profiles':
            print("ORGANISATION PROFILES")
            print("=====================")
            for x in p:
                print(f"\n[{x.org_id}] {x.name}")
                print(f"  Sector         : {x.sector}")
                print(f"  Risk Appetite  : {x.risk_appetite}")
                print(f"  Weights        : KEV={x.weights.cisa_kev_weight:.0%}, EPSS={x.weights.first_epss_weight:.0%}, "
                      f"CVSS={x.weights.cvss_weight:.0%}, Exposure={x.weights.exposure_weight:.0%}, Importance={x.weights.importance_weight:.0%}")
                print("  Technologies   :")
                for t in x.technologies:
                    v_info = f" (version: {t.version})" if t.version and t.version != "unknown" else ""
                    print(f"    - {t.product}{v_info} | Service: '{t.service}' [{t.exposure}] ({t.importance})")
            return

        if args.cmd == 'quality':
            v_issues = validate_vulnerabilities(v)
            p_issues = validate_profiles(p)
            unmatched = validate_gold(g, v)
            print("DATA QUALITY & INTEGRITY REPORT")
            print("================================")
            print(f"Vulnerability records : {len(v)}")
            print(f"Unique CVEs           : {len({x.cve_id for x in v})}")
            print(f"Unique products       : {len({x.product_name for x in v})}")
            print(f"KEV confirmed count   : {sum(1 for x in v if x.cisa_kev)}")
            print(f"CVSS Range            : {min(x.cvss_base_score for x in v):.1f} - {max(x.cvss_base_score for x in v):.1f}")
            print(f"EPSS Range            : {min(x.first_epss for x in v):.5g} - {max(x.first_epss for x in v):.5g}")
            print(f"Vulnerability issues  : {len(v_issues)} {v_issues if v_issues else '(None)'}")
            print(f"Profile issues        : {len(p_issues)} {p_issues if p_issues else '(None)'}")
            print(f"Gold benchmark rows   : {len(g)} (Unmatched in dataset: {len(unmatched)})")
            return

        if args.cmd == 'compare-orgs':
            a, b = get_org(p, args.org1), get_org(p, args.org2)
            ra, rb = rank_personalized(v, a), rank_personalized(v, b)
            sa = [x.vulnerability.cve_id for x in ra.ranked[:5]]
            sb = [x.vulnerability.cve_id for x in rb.ranked[:5]]
            common = sorted(set(sa) & set(sb))
            different = sorted(set(sa) ^ set(sb))

            print("================================================================================")
            print(f"             ORGANISATION COMPARISON: {a.org_id} vs {b.org_id}                 ")
            print("================================================================================")
            print(f"\n--- {a.name} ({a.org_id}) TOP 5 ---")
            for x in ra.ranked[:5]:
                print(f"  #{x.rank} {x.vulnerability.cve_id} | {x.vulnerability.product_name:<26} | Priority: {x.priority.value:<6} (Score: {x.breakdown.score_100:.1f})")

            print(f"\n--- {b.name} ({b.org_id}) TOP 5 ---")
            for x in rb.ranked[:5]:
                print(f"  #{x.rank} {x.vulnerability.cve_id} | {x.vulnerability.product_name:<26} | Priority: {x.priority.value:<6} (Score: {x.breakdown.score_100:.1f})")

            print("\n--- COMPARISON ANALYSIS ---")
            print(f"Common Top 5 CVEs   : {', '.join(common) if common else 'None (Complete Personalisation)'}")
            print(f"Divergent Top 5 CVEs: {', '.join(different)}")
            print("\nKey Driver: Rankings diverge because each organisation operates distinct technology stacks,")
            print("different asset exposures (internet-facing vs internal), and distinct service criticalities.")
            return

        o = get_org(p, args.org)
        r = rank_personalized(v, o)

        if args.cmd == 'analyze':
            output_ranking(r, args)

        elif args.cmd == 'evidence':
            x = next((item for item in r.ranked if item.vulnerability.cve_id == args.cve), None)
            if not x:
                # Check in excluded items
                x = next((item for item in r.excluded if item.vulnerability.cve_id == args.cve), None)
            if not x:
                raise ValueError(f"CVE '{args.cve}' not found in evaluated dataset.")

            v_rec = x.vulnerability
            b = x.breakdown
            f = b.factors_100 or {}
            m = x.match
            t = m.matched_technology
            exp_str = t.exposure if t else "N/A"
            imp_str = t.importance if t else "N/A"
            svc_str = t.service if t else "N/A"

            print("================================================================================")
            print(f"                       EVIDENCE DRAWER: {v_rec.cve_id}                          ")
            print("================================================================================")
            print(f"CVE ID        : {v_rec.cve_id}")
            print(f"Product       : {v_rec.product_name}")
            print(f"Organisation  : {o.name} ({o.org_id})")
            print(f"Rank Status   : {'Rank #' + str(x.rank) if x.rank > 0 else 'EXCLUDED / UNRANKED'}")
            print(f"Priority      : {x.priority.value} (Score: {b.score_100:.1f} / 100)")
            print(f"Confidence    : {x.confidence.value}")
            print("\n--- SOURCE FACTS ---")
            print(f"CVSS Score    : {v_rec.cvss_base_score:.1f}")
            print(f"CISA KEV      : {'Confirmed Active Exploitation' if v_rec.cisa_kev else 'No in-the-wild flag'}")
            print(f"FIRST EPSS    : {v_rec.first_epss:.5g} ({v_rec.first_epss:.2%})")
            print(f"Snapshot      : {x.provenance.snapshot_date if x.provenance else '2026-Q1 Snapshot'}")
            print(f"Reference URL : {x.provenance.reference_url if x.provenance else 'N/A'}")
            print("\n--- MATCHING & RELEVANCE ---")
            print(f"Decision      : {m.outcome.value} ({m.reason_code.value})")
            print(f"Reason        : {m.match_reason}")
            print(f"Asset Context : Service='{svc_str}' | Exposure={exp_str} | Importance={imp_str}")
            print(f"\n--- SCORE POINT CONTRIBUTIONS (Total: {b.score_100:.1f} pts) ---")
            print(f"  - CISA KEV Exploitation : +{f.get('kev', 0):.1f} pts (weight: {b.kev_weight:.0%})")
            print(f"  - FIRST EPSS Probability : +{f.get('epss', 0):.1f} pts (weight: {b.epss_weight:.0%})")
            print(f"  - CVSS Technical Severity: +{f.get('cvss', 0):.1f} pts (weight: {b.cvss_weight:.0%})")
            print(f"  - Asset Exposure Factor  : +{f.get('exposure', 0):.1f} pts (weight: {b.exposure_weight:.0%})")
            print(f"  - Service Importance     : +{f.get('importance', 0):.1f} pts (weight: {b.importance_weight:.0%})")
            print("\n--- EXPLANATION & ACTION ---")
            print(f"Title         : {x.explanation.title if x.explanation else ''}")
            print(f"Why It Matters: {x.explanation.why_it_matters if x.explanation else ''}")
            print(f"Next Action   : {x.explanation.safe_next_action if x.explanation else ''}")
            print("================================================================================")

        elif args.cmd == 'compare':
            base_list = rank_by_cvss(v)
            base_ranks = {x.cve_id: i + 1 for i, x in enumerate(base_list)}

            print("================================================================================")
            print(f"          BASELINE (CVSS-ONLY) vs PERSONALISED TRIAGE: {o.name}                 ")
            print("================================================================================")
            print(f"{'CVE ID':<16} | {'PRODUCT':<24} | {'CVSS RANK':<10} | {'VULTRA RANK':<11} | {'MOVEMENT':<9} | {'PRIORITY'}")
            print("-" * 80)
            for x in r.ranked[:15]:
                b_rank = base_ranks.get(x.vulnerability.cve_id, 'N/A')
                mov_str = f"{b_rank - x.rank:+d}" if isinstance(b_rank, int) else "N/A"
                print(f"{x.vulnerability.cve_id:<16} | {x.vulnerability.product_name:<24} | {str(b_rank):<10} | {str(x.rank):<11} | {mov_str:<9} | {x.priority.value} ({x.breakdown.score_100:.1f})")

        elif args.cmd == 'why-not':
            print("================================================================================")
            print(f"                 SEVERITY != PRIORITY ANALYSIS: {o.name}                         ")
            print("================================================================================")
            print("High-severity vulnerabilities (CVSS >= 9.0) excluded or deprioritised by organisation context:\n")

            # Look for high-CVSS items in excluded or ranked low (> 10)
            high_cvss_excluded = [x for x in r.excluded if x.vulnerability.cvss_base_score >= 9.0]
            # Sort excluded by CVSS descending
            high_cvss_excluded.sort(key=lambda x: -x.vulnerability.cvss_base_score)

            for x in high_cvss_excluded[:6]:
                v_item = x.vulnerability
                m = x.match
                print(f"- {v_item.cve_id} | {v_item.product_name} | CVSS {v_item.cvss_base_score:.1f} | KEV: {v_item.cisa_kev} | EPSS: {v_item.first_epss:.2%}")
                print(f"  Decision : {m.outcome.value} ({m.reason_code.value})")
                print(f"  Why Excluded : {m.match_reason}")
                print()

            # Also check if any high-CVSS matched item was ranked low due to lack of exposure/KEV
            high_cvss_deprioritised = [x for x in r.ranked if x.vulnerability.cvss_base_score >= 9.0 and x.rank > 5 and not x.vulnerability.cisa_kev]
            if high_cvss_deprioritised:
                print("Matched High-CVSS items deprioritised due to lack of active threat signals (No KEV / Low EPSS):")
                for x in high_cvss_deprioritised[:3]:
                    v_item = x.vulnerability
                    b = x.breakdown
                    print(f"- {v_item.cve_id} | {v_item.product_name} | CVSS {v_item.cvss_base_score:.1f} | Personalised Rank: #{x.rank} (Score: {b.score_100:.1f})")
                    print(f"  Reason : No active exploitation signal (KEV=False, EPSS={v_item.first_epss:.2%}) prevents top urgency.")
                    print()

        elif args.cmd == 'evaluate':
            e = evaluate(r, g, o.org_id)
            if not e.available:
                print("No practitioner gold benchmark ranking is available for this organisation.")
            else:
                print("================================================================================")
                print("     GOLD-SET EVALUATION (Evaluation-Only Benchmark; Never Used in Scoring)     ")
                print("================================================================================")
                print(json.dumps(serialise(e), indent=2))

        elif args.cmd == 'what-if':
            w = o.weights
            nw = WeightModifiers(
                cvss_weight=args.cvss_weight if args.cvss_weight is not None else w.cvss_weight,
                cisa_kev_weight=args.kev_weight if args.kev_weight is not None else w.cisa_kev_weight,
                first_epss_weight=args.epss_weight if args.epss_weight is not None else w.first_epss_weight,
                exposure_weight=args.exposure_weight if args.exposure_weight is not None else w.exposure_weight,
                importance_weight=args.importance_weight if args.importance_weight is not None else w.importance_weight,
            )
            sim_org = replace(o, weights=nw)
            sim = rank_personalized(v, sim_org)
            old_ranks = {(x.vulnerability.cve_id, x.vulnerability.product_name): x.rank for x in r.ranked}

            print("================================================================================")
            print(f"                     WHAT-IF SCENARIO SIMULATION: {o.name}                      ")
            print("================================================================================")
            print(f"Original Weights   : KEV={w.cisa_kev_weight:.0%}, EPSS={w.first_epss_weight:.0%}, CVSS={w.cvss_weight:.0%}, Exp={w.exposure_weight:.0%}, Imp={w.importance_weight:.0%}")
            print(f"Simulated Weights  : KEV={nw.cisa_kev_weight:.0%}, EPSS={nw.first_epss_weight:.0%}, CVSS={nw.cvss_weight:.0%}, Exp={nw.exposure_weight:.0%}, Imp={nw.importance_weight:.0%}")
            print("\nORIGINAL TOP 5:")
            for x in r.ranked[:5]:
                print(f"  #{x.rank} {x.vulnerability.cve_id} | {x.vulnerability.product_name:<24} | Score: {x.breakdown.score_100:.1f}")

            print("\nSIMULATED TOP 5:")
            for x in sim.ranked[:5]:
                prev_rank = old_ranks.get((x.vulnerability.cve_id, x.vulnerability.product_name), "N/A")
                shift = f"(was #{prev_rank})" if prev_rank != "N/A" else "(new)"
                print(f"  #{x.rank} {x.vulnerability.cve_id} | {x.vulnerability.product_name:<24} | Score: {x.breakdown.score_100:.1f} {shift}")

        elif args.cmd == 'report':
            content = render_ranking(r, 5)
            content += "\n\nCVSS BASELINE COMPARISON\n------------------------\n"
            base_top = rank_by_cvss(v)[:5]
            for i, x in enumerate(base_top, 1):
                content += f"#{i}: {x.cve_id} ({x.product_name}) - CVSS {x.cvss_base_score:.1f}, KEV={x.cisa_kev}\n"

            content += "\nBENCHMARK EVALUATION\n--------------------\n"
            content += json.dumps(serialise(evaluate(r, g, o.org_id)), indent=2)

            content += (
                "\n\nMETHODOLOGY & PROVENANCE\n------------------------\n"
                "VULTRA triage combines technical threat signals (CISA KEV, FIRST EPSS, CVSS) with "
                "organisational deployment context (asset exposure and service criticality). "
                "Product matches and version constraints are evaluated deterministically with full "
                "provenance retained from vulnerabilities.csv.\n"
            )
            out_path = Path('reports') / f"{o.org_id}-report.txt"
            write_report(out_path, content)
            print(f"Triage decision report written successfully to: {out_path}")

    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
