import { test, expect, type Page } from '@playwright/test';

async function enter(page:Page) {await page.goto('/demo/studio');await expect(page.getByLabel('Draft title')).toBeVisible();}
async function review(page:Page) {await page.getByRole('button',{name:/Run Brand Review/}).click();await expect(page.getByText('REVIEW COMPLETE',{exact:true})).toBeVisible();}
async function baseline(page:Page) {await page.getByRole('button',{name:/Try a sample draft/}).click();await page.getByRole('button',{name:/The Northline introduction/}).click();await review(page);}
async function nav(page:Page,label:string) {
  if(await page.getByRole('button',{name:'Open navigation'}).isVisible())await page.getByRole('button',{name:'Open navigation'}).click();
  await page.getByRole('navigation',{name:'Workspace navigation'}).getByRole('link',{name:new RegExp(`^${label}(?: \\d+)?$`)}).click();
  const headings:Record<string,RegExp>={'Overview':/Your brand/,'Content Studio':/Words, under the lens/,'Evidence Library':/Evidence, in order/,'Review Desk':/The Review Desk/,'Publication Records':/Words, on the record/};
  await expect(page.getByRole('heading',{name:headings[label],level:1})).toBeVisible();
}
async function noOverflow(page:Page) {expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
async function capture(page:Page,path:string) {await expect(page.locator('.toast')).toHaveCount(0);await page.evaluate(()=>{window.scrollTo(0,0);if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});await page.screenshot({path,fullPage:true});if(path.endsWith('-1280.png'))await page.screenshot({path:path.replace('.png','-viewport.png'),fullPage:false});}

test('the complete judge journey preserves an approved revision and its evidence',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('link',{name:'Open the demo workspace',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Your brand/})).toBeVisible();
  await page.getByRole('link',{name:'Start a brand review'}).click();
  await review(page);await expect(page.getByRole('heading',{name:'Use the approved language'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'A guarantee without substantiation'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'The number does not match'})).toBeVisible();
  await page.getByRole('button',{name:/TERM-006 · V1/}).click();await expect(page.getByRole('heading',{name:'Behind the statement.'})).toHaveCount(0);await expect(page.getByRole('heading',{name:'The governing evidence'})).toBeVisible();await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Apply suggestion',exact:true}).click();await expect(page.getByLabel('Content to review')).toHaveValue(/assisted automation/);
  await expect(page.getByText('V02',{exact:true})).toBeVisible();
  await page.getByLabel('Content to review').fill('Our assisted automation helps teams move faster. Trusted by more than 12,000 customers.');await review(page);
  await expect(page.getByText('NO BLOCKERS',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Submit for review',exact:true}).click();
  await page.getByRole('link',{name:'Open Review Desk',exact:true}).click();await page.getByLabel('Decision note',{exact:false}).fill('The revised claim is consistent with the approved evidence.');await page.getByRole('button',{name:'Approve this version',exact:true}).click();
  await page.getByRole('button',{name:'Confirm human approval',exact:true}).click();await expect(page.getByRole('heading',{name:'A decision, on the record.'})).toBeVisible();
  await page.getByRole('link',{name:'View Publication Record',exact:true}).click();
  await expect(page.getByRole('heading',{name:/This version has/})).toBeVisible();await expect(page.getByText('Our assisted automation helps teams move faster. Trusted by more than 12,000 customers.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'View earlier revisions and scans'}).click();await expect(page.getByText('Our AI autopilot guarantees 40% faster results for 20,000 customers.',{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:/This version has/})).toBeVisible();expect(errors).toEqual([]);
});

test('blocking findings need meaningful reviewer overrides and record every reason',async({page})=>{
  await enter(page);await review(page);await page.getByRole('button',{name:'Submit for review',exact:true}).click();await nav(page,'Review Desk');
  await expect(page.getByRole('button',{name:'Approve this version',exact:true})).toBeDisabled();
  for(const text of ['A guarantee without substantiation','The number does not match']){
    const finding=page.locator('.review-finding').filter({has:page.getByRole('button',{name:text,exact:true})});
    await finding.getByRole('button',{name:'Override with reason'}).click();await page.getByLabel('Reason for accepting this exception').fill('ok');await expect(page.getByRole('button',{name:'Record override'})).toBeDisabled();await page.getByLabel('Reason for accepting this exception').fill('Accepted only to demonstrate an accountable fictional exception.');await page.getByRole('button',{name:'Record override'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Approve this version',exact:true}).click();await page.getByRole('button',{name:'Confirm human approval',exact:true}).click();await nav(page,'Publication Records');await expect(page.getByText('Accepted only to demonstrate an accountable fictional exception.',{exact:true})).toHaveCount(4);
});

test('request changes returns the exact revision to the creator',async({page})=>{
  await enter(page);await baseline(page);await page.getByRole('button',{name:'Submit for review',exact:true}).click();await nav(page,'Review Desk');await expect(page.getByRole('button',{name:'Request changes',exact:true})).toBeDisabled();await page.getByLabel('Decision note',{exact:false}).fill('Please add a more specific headline before publication.');await page.getByRole('button',{name:'Request changes',exact:true}).click();await page.getByRole('button',{name:'Confirm request for changes'}).click();await nav(page,'Content Studio');await expect(page.getByText('Changes requested',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Write',exact:true}).click();await expect(page.getByLabel('Content to review')).toBeEnabled();
});

test('evidence can be created edited and archived with scan invalidation',async({page})=>{
  await enter(page);await baseline(page);await nav(page,'Evidence Library');await page.getByRole('button',{name:'Add evidence'}).click();await page.getByLabel('Category',{exact:true}).selectOption('term');await page.getByLabel('Record title').fill('Plain language rule');await page.getByLabel('Phrases to detect').fill('synergy');await page.getByLabel('Approved wording',{exact:true}).fill('teamwork');await page.getByLabel('Source document title').fill('Northline Plain Language Memo');await page.getByLabel('Approval status').selectOption('approved');await page.getByRole('button',{name:'Save evidence revision'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Search evidence').fill('Plain language rule');await page.getByRole('button',{name:/Plain language rule/}).click();await page.getByRole('button',{name:'Edit record'}).click();await page.getByLabel('Record title').fill('Revised plain language rule');await page.getByRole('button',{name:'Save evidence revision'}).click();await page.getByRole('button',{name:/Revised plain language rule/}).click();await page.getByRole('button',{name:'Archive',exact:true}).click();await page.getByRole('button',{name:'Archive record',exact:true}).click();await expect(page.getByText('archived',{exact:true})).toBeVisible();
  await page.getByLabel('Search evidence').fill('Global customer count');await page.getByRole('button',{name:/Global customer count/}).click();await page.getByRole('button',{name:'Edit record'}).click();await page.getByLabel('Record title').fill('Updated global customer count');await page.getByRole('button',{name:'Save evidence revision'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await nav(page,'Content Studio');await expect(page.getByText(/Analysis outdated/)).toBeVisible();await expect(page.getByRole('button',{name:'Submit for review',exact:true})).toBeDisabled();
});

test('separate browser contexts have independent demo workspaces',async({browser})=>{
  const a=await browser.newContext(),b=await browser.newContext();const pa=await a.newPage(),pb=await b.newPage();await enter(pa);await enter(pb);
  const ids=await Promise.all([pa,pb].map(p=>p.evaluate(()=>JSON.parse(localStorage.getItem('colophon.workspace.v1')!).id)));expect(ids[0]).not.toBe(ids[1]);await a.close();await b.close();
});

for(const [width,height] of [[390,844],[768,1024],[1280,800],[1920,1080]]){
  test(`responsive judge workflow at ${width}×${height}`,async({page})=>{
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await noOverflow(page);await capture(page,`artifacts/landing-${width}.png`);await enter(page);await review(page);await noOverflow(page);await capture(page,`artifacts/studio-${width}.png`);
    await baseline(page);await page.getByRole('button',{name:'Submit for review',exact:true}).click();await nav(page,'Review Desk');await noOverflow(page);await page.getByRole('button',{name:'Approve this version',exact:true}).click();await expect(page.getByRole('dialog')).toBeInViewport();await noOverflow(page);await page.getByRole('button',{name:'Confirm human approval',exact:true}).click();await nav(page,'Publication Records');await noOverflow(page);await capture(page,`artifacts/record-${width}.png`);await nav(page,'Evidence Library');await noOverflow(page);
    expect(await page.evaluate(()=>getComputedStyle(document.querySelector('.workspace')!).animationName)).toBe('none');
  });
}
