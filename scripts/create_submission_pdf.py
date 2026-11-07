"""Generate the Round 2 submission from real verified product captures.

Run only after checks pass and docs/screenshots contains final browser captures.
Requires reportlab; uses installed Windows fonts with portable PDF fallbacks.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import argparse
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'colophon-round2.pdf'
parser = argparse.ArgumentParser()
parser.add_argument('--unit-tests', type=int, required=True)
parser.add_argument('--browser-tests', type=int, required=True)
parser.add_argument('--live-browser-tests', type=int, required=True)
args = parser.parse_args()
OUT.parent.mkdir(parents=True, exist_ok=True)
INK, PAPER, MOSS, SAGE, LINE, NIGHT = map(HexColor, ['#14251f','#f6f4ed','#526448','#b9c79c','#d4dec4','#0b1513'])
fonts = [('Display','georgia.ttf','Times-Roman'),('DisplayItalic','georgiai.ttf','Times-Italic'),('Interface','arial.ttf','Helvetica'),('InterfaceBold','arialbd.ttf','Helvetica-Bold')]
registered = {}
for name, filename, fallback in fonts:
    path = Path('C:/Windows/Fonts') / filename
    if path.exists():
        pdfmetrics.registerFont(TTFont(name,str(path)))
        registered[name] = name
    else:
        registered[name] = fallback
pdfmetrics.registerFontFamily(registered['Interface'], normal=registered['Interface'], bold=registered['InterfaceBold'])
W,H = 595.276,841.89
c = canvas.Canvas(str(OUT), pagesize=(W,H))
c.setTitle('Colophon | CodeNexus India 2026 Round 2')
c.setAuthor('Kanishk Rungta | SCHRODINGERS CODE')
c.setSubject('Evidence-first brand governance: product, implementation, verification, and roadmap')

def para(text,x,y,width,size=10,font='Interface',color=INK,leading=None):
    p = Paragraph(text,ParagraphStyle('p',fontName=registered[font],fontSize=size,leading=leading or size*1.65,textColor=color))
    _,height=p.wrap(width,H)
    p.drawOn(c,x,y-height)
    return y-height

def label(text,x,y,color=MOSS,size=7):
    c.setFont('Courier',size);c.setFillColor(color);c.drawString(x,y,text)

def rule(y,x=48,width=W-96,color=LINE):
    c.setStrokeColor(color);c.setLineWidth(.6);c.line(x,y,x+width,y)

def brand(x,y,color=INK):
    c.setFillColor(color)
    for i,h in enumerate([15,21,17]):
        p=c.beginPath();xx=x+i*6;p.moveTo(xx,y);p.lineTo(xx+3,y+1.5);p.lineTo(xx+3,y+h+1.5);p.lineTo(xx,y+h);p.close();c.drawPath(p,fill=1,stroke=0)
    c.setFont(registered['InterfaceBold'],18);c.drawString(x+26,y+1,'colophon.')

def base(page,kicker,title,italic=None):
    c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    brand(48,H-62)
    label('CODENEXUS INDIA 2026 / ROUND 2',W-235,H-49)
    rule(H-83)
    label(kicker,48,H-114)
    y=H-140
    y=para(escape(title),48,y,W-96,31,'Display',INK,36)
    if italic:y=para(escape(italic),48,y-2,W-96,31,'DisplayItalic',MOSS,36)
    return y-24

def end(page,dark=False):
    color=SAGE if dark else MOSS
    rule(48,color=HexColor('#324131') if dark else LINE)
    label('SCHRODINGERS CODE / KANISHK RUNGTA',48,31,color,6)
    label(f'COLOPHON / 0{page}',W-115,31,color,6)
    c.showPage()

def image_fit(filename,x,y,width,height):
    path=ROOT/'docs'/'screenshots'/filename
    if not path.exists():raise FileNotFoundError(path)
    im=ImageReader(str(path));iw,ih=im.getSize();scale=min(width/iw,height/ih)
    dw,dh=iw*scale,ih*scale
    c.drawImage(im,x+(width-dw)/2,y-dh,width=dw,height=dh,mask='auto')
    return y-dh

# 1 / An original editorial cover.
c.bookmarkPage('overview');c.addOutlineEntry('Colophon: overview','overview',0)
c.setFillColor(NIGHT);c.rect(0,0,W,H,fill=1,stroke=0)
brand(48,H-70,PAPER)
label('CODENEXUS INDIA 2026 / ROUND 2',48,H-111,SAGE,7)
para('Every claim<br/>leaves a trail.',48,H-164,W-90,61,'Display',PAPER,67)
para('The record behind every publish.',50,502,470,20,'DisplayItalic',SAGE,27)
para('Evidence-first brand governance. Inspect the draft, follow its sources, and preserve the final human decision.',50,451,380,11,'Interface',HexColor('#b4c0ab'),19)
c.setFillColor(HexColor('#e9eddd'));c.roundRect(48,189,W-96,166,3,fill=1,stroke=0)
label('NORTHLINE / FICTIONAL DEMO DRAFT',68,330,MOSS,7)
para('Our AI autopilot guarantees 40% faster results for 20,000 customers.',68,309,W-136,24,'Display',INK,33)
rule(226,68,W-136,HexColor('#cbd7b9'))
label('TERM-006    CLAIM-004    FACT-021',68,207,MOSS,7)
para('Real checks. Human approval. An inspectable record.',50,157,450,11,'Interface',SAGE,18)
label('LIVE DEMO / HTTPS://COLOPHON-ONE.VERCEL.APP',50,108,HexColor('#9fae90'),7)
end(1,True)

# 2 / Product and actual interface.
c.bookmarkPage('workflow');c.addOutlineEntry('The working product','workflow',0)
y=base(2,'01 / THE WORKING PRODUCT','A review with a source.','A decision with a history.')
y=para('Brand guidance is scattered. Colophon turns it into an inspectable review: the exact phrase, the governing evidence, a focused correction, and an accountable human decision.',48,y,W-96,10)
y-=20
for n,title,body in [
    ('01','Establish the source of truth.','Manage approved facts, terminology, claims policies, and tone guidance.'),
    ('02','Put the words under the lens.','Run subject-aware deterministic checks. Inspect precise findings and source snapshots.'),
    ('03','Revise, rescan, and decide.','Preserve revisions. Request changes or record explicit, reasoned human approval.'),
    ('04','Keep the Publication Record.','Retain exact words, policy versions, exceptions, the reviewer, and the audit trail.')]:
    label(n,48,y-6,MOSS,9)
    yy=para(escape(title),79,y,W-127,11,'InterfaceBold')
    yy=para(escape(body),79,yy-4,W-127,9,'Interface',MOSS,14)
    y=yy-19
rule(y+5)
y-=16
label('ACTUAL APPLICATION CAPTURE / CONTENT STUDIO',48,y,MOSS,6)
y=image_fit('studio-viewport.png',48,y-12,W-96,220)
assert y>64,('page 2 overflow',y)
end(2)

# 3 / Engineering and truth boundaries.
c.bookmarkPage('engineering');c.addOutlineEntry('Engineering and evidence','engineering',0)
y=base(3,'02 / ENGINEERING & EVIDENCE','Built around the workflow.','Honest about its boundaries.')
for title,body in [
    ('One coherent application.','Next.js App Router, React, TypeScript, Zod, Lucide, and custom CSS. A pure command handler and verification engine power both browser-local and optional hosted modes.'),
    ('Four explicit verdicts.','Supported, contradicted, insufficient evidence, and advisory. Case-insensitive terminology, subject-specific numerical facts, guarantee policies, and tone guidance produce exact source spans. Missing evidence is never equated with falsehood.'),
    ('A version is never silently rewritten.','Saved revisions are immutable. Suggestions use validated text offsets. New evidence revisions and expiry invalidate stale scans. Approval copies the exact reviewed revision, source versions, findings, exceptions, and relevant audit events.'),
    ('Immediately usable without credentials.','An isolated browser-local Northline demo provides real verification, revision, approval, and publication records. Browser storage is not production authentication or a tamper-resistant database. All Northline sources and statistics are fictional.'),
    ('Verified hosted persistence.','The public Vercel deployment uses Supabase anonymous auth, membership checks, and RLS. Real isolation, reviewer permissions, refresh persistence, and concurrent-save checks passed. Migration 001 is applied; history guards and rate limiting are installed.'),
    ('Optional AI, carefully constrained.','The hosted OpenAI adapter uses strict JSON Schema, exact span/evidence-ID validation, advisory-only observations, and a timeout. Missing keys and rejected responses preserve deterministic checks. Live-provider quality is not claimed without evaluation.')]:
    y=para(escape(title),48,y,W-96,13,'Display',INK,17)
    y=para(escape(body),48,y-7,W-96,9.5,'Interface',MOSS,14)
    y-=18
assert y>64,('page 3 overflow',y)
end(3)

# 4 / Verification and the actual publication artifact.
c.bookmarkPage('verification');c.addOutlineEntry('Verification and publication record','verification',0)
y=base(4,'03 / VERIFIED BEHAVIOR','The evidence of the build.')
stats=[(str(args.unit_tests),'UNIT / INTEGRATION TESTS'),(str(args.live_browser_tests),'LIVE HOSTED BROWSER TESTS'),('28','LABELLED REGRESSION SAMPLES')]
width=(W-96)/3
for i,(number,caption) in enumerate(stats):
    x=48+i*width
    para(number,x,y,width-10,38,'Display',INK,42)
    label(caption,x,y-56,MOSS,5.5)
y-=89
y=para(f'Actual results: {args.browser_tests} earlier browser tests passed on each local development/production server. {args.live_browser_tests} distinct tests passed in scoped runs against the public site: judge workflow, evidence/review operations, real RLS and role checks, concurrent saves, four responsive widths, and automated accessibility.',48,y,W-96,9.5,'Interface',MOSS,15)
y=para('TypeScript, ESLint, and the production build passed. Detailed results and the earlier dependency audit are in docs/VERIFICATION.md. Automated accessibility checks do not establish full WCAG conformance. Live AI, destructive tampering, quota exhaustion, and production-scale behavior remain unevaluated.',48,y-14,W-96,9.5,'Interface',MOSS,15)
y-=26
label('ACTUAL APPLICATION CAPTURE / PUBLICATION RECORD',48,y,MOSS,6)
y=image_fit('record-viewport.png',48,y-13,W-96,273)
y=para('A reviewed version, its sources, and the human decision are preserved together. The SHA-256 text fingerprint identifies the words; it is not proof of authenticity or legal certification.',48,y-14,W-96,9,'Interface',MOSS,14)
assert y>64,('page 4 overflow',y)
end(4)

# 5 / Submission and substantive next steps.
c.bookmarkPage('roadmap');c.addOutlineEntry('Round 3 and submission readiness','roadmap',0)
y=base(5,'04 / NEXT CHAPTER','Three substantial improvements.','A clear path to Round 3.')
for n,title,body in [
    ('01','Visual Brand Governance','Image uploads, OCR, approved-logo matching, outdated assets, palette/spacing policies, and region-level evidence findings. Acceptance: labelled visual evaluation, source-linked regions, isolated storage, and human-reviewed exceptions.'),
    ('02','Guideline Debt Analytics','Trace repeated disputes and overrides to their policy revisions. Identify confusing guidelines, show outcome trends, and propose administrator-approved improvements. Never weaken rules automatically.'),
    ('03','Advanced Evidence Verification','Explicit supersession, better subject decomposition, multi-source conflict handling, source-span validation, and evidence lineage. Acceptance: a held-out regression set with measured unsupported-claim and false-positive results.')]:
    label(n,48,y-8,MOSS,9)
    yy=para(escape(title),80,y,W-128,16,'Display')
    yy=para(escape(body),80,yy-9,W-128,9.5,'Interface',MOSS,14)
    y=yy-20
rule(y+6)
y-=17
y=para('Submission readiness',48,y,W-96,18,'Display')
y=para('Source: github.com/Kanishk-Rungta/Colophon<br/>Public demo: https://colophon-one.vercel.app/demo<br/>Vercel was configured by the owner; Supabase migration 001 is applied and tracked.<br/>Deployment instructions, feature status, live test results, and limitations are included in the repository.',48,y-10,W-96,9.5,'Interface',MOSS,16)
y-=21
y=para('Tools and assistance disclosure',48,y,W-96,14,'Display')
y=para('Kanishk Rungta supplied the product direction and specification. Codex assisted with architecture, implementation, interface design, tests, debugging, and documentation. Significant tools include Next.js, React, TypeScript, Supabase libraries, Vitest, Playwright, axe-core, ReportLab, and PDFium. No additional team members or independent-authorship claims are invented.',48,y-8,W-96,9,'Interface',MOSS,14)
assert y>64,('page 5 overflow',y)
end(5)
c.save()
print(OUT)
